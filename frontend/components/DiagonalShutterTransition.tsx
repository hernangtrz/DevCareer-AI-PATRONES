"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

interface GridMetrics {
  width: number;
  columns: number;
  rows: number;
  cellWidth: number;
  delays: number[];
}

interface AuthShutterContextValue {
  navigateWithShutter: (href: string) => void;
  isTransitioning: boolean;
}

const AuthShutterContext = createContext<AuthShutterContextValue | null>(null);

export function useAuthShutter(): AuthShutterContextValue {
  const ctx = useContext(AuthShutterContext);
  if (!ctx) {
    return {
      navigateWithShutter: () => {},
      isTransitioning: false,
    };
  }
  return ctx;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Computes exact diagonal shutter grid geometry & bottom-right radial delays:
 * - >= 1024px: 4 cols x 3 rows; < 1024px: 3 cols x 4 rows.
 * - cellWidth = V / (columns - 1), total grid width = V + cellWidth, left = -cellWidth / 2.
 * - Radial stagger outward from bottom-right (from: [1, 1]):
 *   distance = hypot(col - (columns - 0.5), row - (rows - 0.5))
 *   delay = 3 * (distance - minDistance) / (maxDistance - minDistance)
 */
function computeGridMetrics(frameWidth: number): GridMetrics {
  const safeWidth = Math.max(frameWidth, 320);
  const columns = safeWidth >= 1024 ? 4 : 3;
  const rows = safeWidth >= 1024 ? 3 : 4;
  const cellWidth = safeWidth / (columns - 1);

  const distances: number[] = [];
  let minDist = Infinity;
  let maxDist = -Infinity;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const d = Math.hypot(col - (columns - 0.5), row - (rows - 0.5));
      distances.push(d);
      if (d < minDist) minDist = d;
      if (d > maxDist) maxDist = d;
    }
  }

  const span = Math.max(maxDist - minDist, 0.0001);
  const delays = distances.map((d) => (3 * (d - minDist)) / span);

  return {
    width: safeWidth,
    columns,
    rows,
    cellWidth,
    delays,
  };
}

interface DiagonalShutterProviderProps {
  children: React.ReactNode;
  /** Primary settling tile color (DevCareer cobalt). */
  primaryColor?: string;
  /** Leading passing accent tile color (DevCareer violet). */
  accentColor?: string;
  /** Whether to play a one-shot diagonal reveal when first entering the auth layout. */
  playInitialReveal?: boolean;
}

/**
 * Reusable staggered diagonal shutter-grid transition for DevCareer AI's auth pages (/sign-in <-> /sign-up).
 * - Preserves exact 4x3 / 3x4 skewed (-9.2deg) overscanned tile geometry and sineIn / sineInOut stagger math.
 * - Uses translate3d on GPU compositor layers, ResizeObserver, single-RAF scheduling, and clean teardown.
 * - Respects prefers-reduced-motion: reduce (disables shutter layers and navigates immediately).
 */
export function DiagonalShutterProvider({
  children,
  primaryColor = "#2426d8",
  accentColor = "#a78bfa",
  playInitialReveal = true,
}: DiagonalShutterProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const primaryFillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const accentFillRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [metrics, setMetrics] = useState<GridMetrics>(() => computeGridMetrics(1280));
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const metricsRef = useRef(metrics);
  const reducedMotionRef = useRef(false);
  const progressRef = useRef(0);
  const rafRef = useRef(0);
  const phaseRef = useRef<"idle" | "covering" | "waiting-route" | "revealing">("idle");
  const pendingHrefRef = useRef<string | null>(null);
  const routeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedInitialRef = useRef(false);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Apply progress p in [0, 1] directly to GPU transform layers using the exact shutter equations
  const applyProgress = useCallback((p: number, animateContent: boolean) => {
    const clampedP = clamp01(p);
    progressRef.current = clampedP;
    const { delays } = metricsRef.current;

    for (let i = 0; i < delays.length; i++) {
      const localTime = clampedP * 5 - delays[i];

      // Primary cobalt fill: t = clamp01(localTime - 1), sineIn = 1 - cos(t * PI / 2), Y = 110 * (1 - sineIn)%
      const tPrimary = clamp01(localTime - 1);
      const sineIn = 1 - Math.cos(tPrimary * Math.PI * 0.5);
      const primaryY = 110 * (1 - sineIn);
      const primaryEl = primaryFillRefs.current[i];
      if (primaryEl) {
        primaryEl.style.transform = `translate3d(0, ${primaryY.toFixed(3)}%, 0)`;
      }

      // Accent violet fill: t = clamp01(localTime / 2), sineInOut = (1 - cos(t * PI)) / 2, Y = 110 - 220 * sineInOut%
      const tAccent = clamp01(localTime * 0.5);
      const sineInOut = (1 - Math.cos(tAccent * Math.PI)) * 0.5;
      const accentY = 110 - 220 * sineInOut;
      const accentEl = accentFillRefs.current[i];
      if (accentEl) {
        accentEl.style.transform = `translate3d(0, ${accentY.toFixed(3)}%, 0)`;
      }
    }

    const contentEl = contentRef.current;
    if (contentEl) {
      if (animateContent) {
        // Ease content smoothly during the reveal half (progress 0.5 -> 0 maps to reveal 0 -> 1)
        const revealProgress = clamp01((0.5 - clampedP) / 0.5);
        const reveal = (1 - Math.cos(revealProgress * Math.PI)) * 0.5;
        const offsetY = 24 * (1 - reveal);
        contentEl.style.opacity = reveal.toFixed(4);
        contentEl.style.transform = `translate3d(0, ${offsetY.toFixed(2)}px, 0)`;
      } else {
        contentEl.style.opacity = "";
        contentEl.style.transform = "";
      }
    }
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== 0) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (routeFallbackTimerRef.current) {
      clearTimeout(routeFallbackTimerRef.current);
      routeFallbackTimerRef.current = null;
    }
  }, []);

  const runProgressAnimation = useCallback(
    (
      fromP: number,
      toP: number,
      durationMs: number,
      animateContent: boolean,
      onComplete: () => void
    ) => {
      stopRaf();
      let startTs = 0;

      const tick = (now: number) => {
        if (startTs === 0) startTs = now;
        const rawT = clamp01((now - startTs) / durationMs);
        // Smooth cosine pace so the diagonal shutter sweep feels fluid, never mechanical
        const easedT = (1 - Math.cos(rawT * Math.PI)) * 0.5;
        const p = fromP + (toP - fromP) * easedT;
        applyProgress(p, animateContent);

        if (rawT < 1) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          rafRef.current = 0;
          applyProgress(toP, animateContent);
          onComplete();
        }
      };

      applyProgress(fromP, animateContent);
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [applyProgress, stopRaf]
  );

  const startReveal = useCallback(
    (durationMs = 620) => {
      phaseRef.current = "revealing";
      setOverlayVisible(true);
      setIsTransitioning(true);
      runProgressAnimation(1, 0, durationMs, true, () => {
        phaseRef.current = "idle";
        pendingHrefRef.current = null;
        setOverlayVisible(false);
        setIsTransitioning(false);
        const contentEl = contentRef.current;
        if (contentEl) {
          contentEl.style.opacity = "";
          contentEl.style.transform = "";
        }
      });
    },
    [runProgressAnimation]
  );

  // Sync reduced-motion preference & ResizeObserver
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => {
      reducedMotionRef.current = mq.matches;
      setReducedMotion(mq.matches);
      if (mq.matches) {
        stopRaf();
        phaseRef.current = "idle";
        setOverlayVisible(false);
        setIsTransitioning(false);
        const contentEl = contentRef.current;
        if (contentEl) {
          contentEl.style.opacity = "";
          contentEl.style.transform = "";
        }
      }
    };
    syncReduced();
    mq.addEventListener("change", syncReduced);

    const updateFrameSize = () => {
      const w = frameRef.current?.clientWidth || window.innerWidth;
      setMetrics((prev) => {
        const next = computeGridMetrics(w);
        if (prev.width === next.width && prev.columns === next.columns && prev.rows === next.rows) {
          return prev;
        }
        metricsRef.current = next;
        return next;
      });
    };
    updateFrameSize();

    let resizeRaf = 0;
    const ro =
      typeof ResizeObserver !== "undefined" && frameRef.current
        ? new ResizeObserver(() => {
            if (resizeRaf !== 0) return;
            resizeRaf = window.requestAnimationFrame(() => {
              resizeRaf = 0;
              updateFrameSize();
              if (phaseRef.current !== "idle") {
                applyProgress(progressRef.current, phaseRef.current === "revealing");
              }
            });
          })
        : null;

    if (ro && frameRef.current) {
      ro.observe(frameRef.current);
    }

    return () => {
      if (resizeRaf !== 0) window.cancelAnimationFrame(resizeRaf);
      ro?.disconnect();
      mq.removeEventListener("change", syncReduced);
      stopRaf();
    };
  }, [applyProgress, stopRaf]);

  // Re-apply tile positions immediately if grid cell count changes across the 1024px breakpoint
  useEffect(() => {
    if (overlayVisible) {
      applyProgress(progressRef.current, phaseRef.current === "revealing");
    }
  }, [metrics.columns, metrics.rows, overlayVisible, applyProgress]);

  // One-shot diagonal shutter entrance reveal when first arriving at /sign-in or /sign-up
  useEffect(() => {
    if (!playInitialReveal || hasPlayedInitialRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const raf = window.requestAnimationFrame(() => {
      if (hasPlayedInitialRef.current) return;
      hasPlayedInitialRef.current = true;
      startReveal(680);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [playInitialReveal, startReveal]);

  // Trigger reverse shutter reveal once Next.js route completes navigation to target auth page
  useEffect(() => {
    if (phaseRef.current === "waiting-route" && pendingHrefRef.current === pathname) {
      if (routeFallbackTimerRef.current) {
        clearTimeout(routeFallbackTimerRef.current);
        routeFallbackTimerRef.current = null;
      }
      const raf = window.requestAnimationFrame(() => {
        startReveal(620);
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [pathname, startReveal]);

  const navigateWithShutter = useCallback(
    (href: string) => {
      if (!href || href === pathname) return;

      // Reduced motion: skip shutters and navigate immediately
      if (reducedMotionRef.current) {
        router.push(href);
        return;
      }

      if (phaseRef.current === "covering" || phaseRef.current === "waiting-route") {
        return;
      }

      phaseRef.current = "covering";
      pendingHrefRef.current = href;
      setOverlayVisible(true);
      setIsTransitioning(true);

      // Phase 1: cover screen (p: 0 -> 1), then swap route at full seamless cobalt coverage
      runProgressAnimation(0, 1, 560, false, () => {
        phaseRef.current = "waiting-route";
        router.push(href);

        // Safety reveal fallback in case route transition is already settled or delayed
        routeFallbackTimerRef.current = setTimeout(() => {
          routeFallbackTimerRef.current = null;
          if (phaseRef.current === "waiting-route") {
            startReveal(620);
          }
        }, 700);
      });
    },
    [pathname, router, runProgressAnimation, startReveal]
  );

  const contextValue = useMemo(
    () => ({
      navigateWithShutter,
      isTransitioning,
    }),
    [navigateWithShutter, isTransitioning]
  );

  const cellCount = metrics.columns * metrics.rows;
  const gridStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: `${-metrics.cellWidth / 2}px`,
    width: `${metrics.width + metrics.cellWidth}px`,
    height: "100%",
    display: "grid",
    gridTemplateColumns: `repeat(${metrics.columns}, 1fr)`,
    gridTemplateRows: `repeat(${metrics.rows}, 1fr)`,
    transform: "skewX(-9.2deg)",
    transformOrigin: "center",
  };

  return (
    <AuthShutterContext.Provider value={contextValue}>
      <div className="relative w-full min-h-screen overflow-x-clip">
        {/* Actual auth content — remains completely unskewed and accessible */}
        <div
          ref={contentRef}
          className="auth-layout relative z-10"
        >
          {children}
        </div>

        {/* Fixed viewport shutter overlay — omitted entirely under prefers-reduced-motion */}
        {!reducedMotion && (
          <div
            ref={frameRef}
            aria-hidden="true"
            className={`fixed inset-0 z-50 overflow-hidden ${
              overlayVisible ? "visible" : "invisible"
            } ${isTransitioning ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            {/* Layer 1: Primary settling cobalt tiles (#2426d8) */}
            <div style={gridStyle}>
              {Array.from({ length: cellCount }).map((_, idx) => (
                <div
                  key={`primary-${metrics.columns}x${metrics.rows}-${idx}`}
                  className="relative overflow-hidden -m-[0.5px]"
                >
                  <div
                    ref={(el) => {
                      primaryFillRefs.current[idx] = el;
                    }}
                    className="absolute -inset-[0.5px] will-change-transform"
                    style={{
                      backgroundColor: primaryColor,
                      transform: "translate3d(0, 110%, 0)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Layer 2: Leading passing accent tiles (#a78bfa) */}
            <div style={gridStyle}>
              {Array.from({ length: cellCount }).map((_, idx) => (
                <div
                  key={`accent-${metrics.columns}x${metrics.rows}-${idx}`}
                  className="relative overflow-hidden -m-[0.5px]"
                >
                  <div
                    ref={(el) => {
                      accentFillRefs.current[idx] = el;
                    }}
                    className="absolute -inset-[0.5px] will-change-transform"
                    style={{
                      backgroundColor: accentColor,
                      transform: "translate3d(0, 110%, 0)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthShutterContext.Provider>
  );
}
