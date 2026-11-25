"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import styles from "./FeedbackPulseStage.module.css";

interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface FeedbackPulseStageProps {
  role: string;
  level?: string;
  formattedDate: string;
  totalScore: number;
  categoryScores: CategoryScore[];
  strengthsCount: number;
  lang: "es" | "en";
}

interface WidgetGeometry {
  homeX: number;
  homeY: number;
  width: number;
  height: number;
}

interface WidgetPhysics {
  offX: number;
  offY: number;
  velX: number;
  velY: number;
}

const IMPULSE_RADIUS = 320;
const MAX_DISPLACEMENT = 96;
const SPRING_K = 120;
const DAMPING = 14;
const REST_EPSILON = 0.1;
const MAX_DT = 1 / 30;
const STALE_POINTER_GAP_SEC = 0.2;
const KEYBOARD_IMPULSE_VELOCITY = 450;

const LANDSCAPE_HOMES: ReadonlyArray<readonly [number, number]> = [
  [510, 340], // 0: hero score frame
  [185, 310], // 1: tilted pass ticket
  [790, 210], // 2: circular highlight
  [750, 465], // 3: competency waveform block
];

const PORTRAIT_HOMES: ReadonlyArray<readonly [number, number]> = [
  [530, 330],
  [205, 230],
  [795, 210],
  [720, 495],
];

const BASE_RADII: ReadonlyArray<number> = [110, 80, 59, 67];

function computeLayout(stageWidth: number, stageHeight: number): WidgetGeometry[] {
  const isPortrait = stageHeight > stageWidth;
  const homes = isPortrait ? PORTRAIT_HOMES : LANDSCAPE_HOMES;
  const radiusMult = isPortrait ? 1.35 : 1;
  const scale = Math.min(stageWidth / 1000, stageHeight / 650);

  return homes.map(([hx, hy], idx) => {
    const r = BASE_RADII[idx] * scale * radiusMult;
    const homeX = (hx / 1000) * stageWidth;
    const homeY = (hy / 650) * stageHeight;

    if (idx === 0) {
      const size = 2.65 * r;
      return { homeX, homeY, width: size, height: size };
    }
    if (idx === 1) {
      return { homeX, homeY, width: 1.8 * r, height: 2.55 * r };
    }
    if (idx === 2) {
      const d = 2 * r;
      return { homeX, homeY, width: d, height: d };
    }
    return { homeX, homeY, width: 2.4 * r, height: 1.4 * r };
  });
}

function getTierLabel(score: number, isEs: boolean): { label: string; color: string } {
  if (score >= 80) return { label: isEs ? "Listo" : "Ready", color: "#34d399" };
  if (score >= 60) return { label: isEs ? "Competitivo" : "Competitive", color: "#a5b4fc" };
  if (score >= 35) return { label: isEs ? "En desarrollo" : "Developing", color: "#fbbf24" };
  return { label: isEs ? "Refuerzo" : "Practice", color: "#fb7185" };
}

export default function FeedbackPulseStage({
  role,
  level,
  formattedDate,
  totalScore,
  categoryScores,
  strengthsCount,
  lang,
}: FeedbackPulseStageProps) {
  const isEs = lang === "es";
  const stageRef = useRef<HTMLDivElement | null>(null);
  const widgetElsRef = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);

  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [keyboardFocusVisible, setKeyboardFocusVisible] = useState(false);

  // Refs for zero-allocation physics loop
  const pausedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);
  const rafIdRef = useRef(0);
  const lastFrameMsRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; timeMs: number } | null>(null);
  const selectedIdxRef = useRef(0);

  const geometryRef = useRef<WidgetGeometry[]>([
    { homeX: 510, homeY: 340, width: 240, height: 240 },
    { homeX: 185, homeY: 310, width: 140, height: 200 },
    { homeX: 790, homeY: 210, width: 118, height: 118 },
    { homeX: 750, homeY: 465, width: 160, height: 94 },
  ]);

  const physicsRef = useRef<WidgetPhysics[]>([
    { offX: 0, offY: 0, velX: 0, velY: 0 },
    { offX: 0, offY: 0, velX: 0, velY: 0 },
    { offX: 0, offY: 0, velX: 0, velY: 0 },
    { offX: 0, offY: 0, velX: 0, velY: 0 },
  ]);

  const safeScore = Math.max(0, Math.min(100, Math.round(totalScore || 0)));
  const tier = getTierLabel(safeScore, isEs);

  const bestCategory = useMemo(() => {
    if (!categoryScores.length) return null;
    return categoryScores.reduce((best, cur) => (cur.score > best.score ? cur : best), categoryScores[0]);
  }, [categoryScores]);

  const barValues = useMemo(() => {
    if (categoryScores.length > 0) {
      return categoryScores.slice(0, 6).map((c) => Math.max(10, Math.min(100, c.score)));
    }
    return [24, 48, 32, 60, 40];
  }, [categoryScores]);

  const applyWidgetTransforms = useCallback(() => {
    const geoms = geometryRef.current;
    const phys = physicsRef.current;
    for (let i = 0; i < 4; i++) {
      const el = widgetElsRef.current[i];
      if (!el) continue;
      const g = geoms[i];
      const p = phys[i];
      const left = g.homeX - g.width / 2 + p.offX;
      const top = g.homeY - g.height / 2 + p.offY;
      el.style.width = `${g.width.toFixed(1)}px`;
      el.style.height = `${g.height.toFixed(1)}px`;
      el.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0)`;
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== 0) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  const releasePointerCaptureSafe = useCallback(() => {
    const stage = stageRef.current;
    const pointerId = activePointerIdRef.current;
    activePointerIdRef.current = null;
    lastPointerRef.current = null;
    if (stage && pointerId !== null) {
      try {
        if (stage.hasPointerCapture(pointerId)) {
          stage.releasePointerCapture(pointerId);
        }
      } catch {
        // ignore if already released
      }
    }
  }, []);

  const resetScene = useCallback(() => {
    stopLoop();
    releasePointerCaptureSafe();
    const stage = stageRef.current;
    if (stage) {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        geometryRef.current = computeLayout(rect.width, rect.height);
      }
    }
    for (let i = 0; i < 4; i++) {
      physicsRef.current[i] = { offX: 0, offY: 0, velX: 0, velY: 0 };
    }
    applyWidgetTransforms();
  }, [applyWidgetTransforms, releasePointerCaptureSafe, stopLoop]);

  const isModalBlocked = useCallback((): boolean => {
    const stage = stageRef.current;
    if (!stage) return false;
    if (stage.closest("[inert]")) return true;
    return Boolean(document.querySelector("dialog[open]"));
  }, []);

  const wakeLoop = useCallback(() => {
    if (
      pausedRef.current ||
      reducedMotionRef.current ||
      !visibleRef.current ||
      document.hidden ||
      isModalBlocked() ||
      rafIdRef.current !== 0
    ) {
      return;
    }

    const tick = (now: number) => {
      rafIdRef.current = 0;

      if (
        pausedRef.current ||
        reducedMotionRef.current ||
        !visibleRef.current ||
        document.hidden ||
        isModalBlocked()
      ) {
        return;
      }

      if (lastFrameMsRef.current === 0) {
        lastFrameMsRef.current = now;
      }
      const dt = Math.min(Math.max((now - lastFrameMsRef.current) / 1000, 0), MAX_DT);
      lastFrameMsRef.current = now;

      let anyMoving = false;
      const phys = physicsRef.current;

      for (let i = 0; i < 4; i++) {
        const p = phys[i];
        p.velX += (-SPRING_K * p.offX - DAMPING * p.velX) * dt;
        p.velY += (-SPRING_K * p.offY - DAMPING * p.velY) * dt;
        p.offX += p.velX * dt;
        p.offY += p.velY * dt;

        const offMag = Math.hypot(p.offX, p.offY);
        if (offMag > MAX_DISPLACEMENT) {
          const clampScale = (MAX_DISPLACEMENT / offMag) * (1 - Number.EPSILON);
          p.offX *= clampScale;
          p.offY *= clampScale;
          p.velX *= clampScale;
          p.velY *= clampScale;
        }

        const velMag = Math.hypot(p.velX, p.velY);
        const finalOffMag = Math.hypot(p.offX, p.offY);
        if (finalOffMag > REST_EPSILON || velMag > REST_EPSILON) {
          anyMoving = true;
        } else {
          p.offX = 0;
          p.offY = 0;
          p.velX = 0;
          p.velY = 0;
        }
      }

      applyWidgetTransforms();

      if (anyMoving) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      }
    };

    lastFrameMsRef.current = performance.now();
    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [applyWidgetTransforms, isModalBlocked]);

  const applyPointerImpulse = useCallback(
    (localX: number, localY: number, nowMs: number) => {
      if (pausedRef.current || reducedMotionRef.current) return;

      const prev = lastPointerRef.current;
      lastPointerRef.current = { x: localX, y: localY, timeMs: nowMs };
      if (!prev) return;

      const dtSec = (nowMs - prev.timeMs) / 1000;
      if (dtSec <= 0 || dtSec > STALE_POINTER_GAP_SEC) return;

      const vx = (localX - prev.x) / dtSec;
      const vy = (localY - prev.y) / dtSec;
      const speed = Math.hypot(vx, vy);
      if (speed <= 0.001) return;

      const ux = vx / speed;
      const uy = vy / speed;

      const rootFontSize =
        parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
      const geoms = geometryRef.current;
      const phys = physicsRef.current;
      const impulseDt = Math.min(dtSec, MAX_DT);

      let wokeAny = false;

      for (let i = 0; i < 4; i++) {
        const g = geoms[i];
        const p = phys[i];
        const cx = g.homeX + p.offX;
        const cy = g.homeY + p.offY;
        const dx = cx - localX;
        const dy = cy - localY;
        const d = Math.hypot(dx, dy);

        if (d > 0 && d < IMPULSE_RADIUS) {
          const widthRem = g.width / rootFontSize;
          const heightRem = g.height / rootFontSize;
          const mass = Math.sqrt((widthRem * heightRem) / (4.54125 * 1.51375));
          const falloff = Math.pow(1 - d / IMPULSE_RADIUS, 2);
          const magnitude =
            speed * falloff * 2.4 * Math.pow(Math.max(mass, 0.05), 0.6) * impulseDt;

          const rx = dx / d;
          const ry = dy / d;
          const dirX = 0.75 * ux + 0.25 * rx;
          const dirY = 0.75 * uy + 0.25 * ry;
          const dirMag = Math.hypot(dirX, dirY) || 1;

          p.velX += (dirX / dirMag) * magnitude;
          p.velY += (dirY / dirMag) * magnitude;
          wokeAny = true;
        }
      }

      if (wokeAny) {
        wakeLoop();
      }
    },
    [wakeLoop]
  );

  // Sync refs with React state
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      stopLoop();
      releasePointerCaptureSafe();
    } else {
      wakeLoop();
    }
  }, [paused, releasePointerCaptureSafe, stopLoop, wakeLoop]);

  useEffect(() => {
    selectedIdxRef.current = selectedIdx;
  }, [selectedIdx]);

  // Master lifecycle: reduced motion, fonts.ready, ResizeObserver, IntersectionObserver, visibilitychange
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let disposed = false;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => {
      reducedMotionRef.current = mq.matches;
      setReducedMotion(mq.matches);
      if (mq.matches) {
        resetScene();
      }
    };
    syncReduced();
    mq.addEventListener("change", syncReduced);

    resetScene();
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready.then(() => {
        if (!disposed) resetScene();
      });
    }

    let resizeRaf = 0;
    const handleResize = () => {
      if (disposed || resizeRaf !== 0) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        if (!disposed) resetScene();
      });
    };

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    ro?.observe(stage);
    window.addEventListener("resize", handleResize);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visibleRef.current = entries[0] ? entries[0].isIntersecting : true;
              if (!visibleRef.current) {
                stopLoop();
              } else {
                wakeLoop();
              }
            },
            { threshold: 0.01 }
          )
        : null;
    io?.observe(stage);

    const onVisibility = () => {
      if (document.hidden) {
        stopLoop();
        releasePointerCaptureSafe();
      } else {
        wakeLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      stopLoop();
      releasePointerCaptureSafe();
      if (resizeRaf !== 0) window.cancelAnimationFrame(resizeRaf);
      mq.removeEventListener("change", syncReduced);
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [releasePointerCaptureSafe, resetScene, stopLoop, wakeLoop]);

  // Pointer & keyboard handlers
  const handlePointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    // Immediately clear keyboard focus outline on pointer interaction
    setKeyboardFocusVisible(false);
    if (pausedRef.current || reducedMotionRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    lastPointerRef.current = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
      timeMs: ev.timeStamp || performance.now(),
    };

    if (ev.pointerType !== "mouse") {
      try {
        stage.setPointerCapture(ev.pointerId);
        activePointerIdRef.current = ev.pointerId;
      } catch {
        // ignore capture errors
      }
    }
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (pausedRef.current || reducedMotionRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    applyPointerImpulse(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      ev.timeStamp || performance.now()
    );
  };

  const handlePointerUpOrCancel = () => {
    releasePointerCaptureSafe();
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "Escape") {
      setKeyboardFocusVisible(false);
      stageRef.current?.blur();
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: "pulse-escape" }, "*");
        } catch {
          // ignore cross-origin restrictions
        }
      }
      return;
    }

    if (pausedRef.current || reducedMotionRef.current) return;

    if (ev.key === " " || ev.code === "Space") {
      ev.preventDefault();
      setKeyboardFocusVisible(true);
      setSelectedIdx((prev) => (prev + 1) % 4);
      return;
    }

    let vx = 0;
    let vy = 0;
    if (ev.key === "ArrowLeft") vx = -KEYBOARD_IMPULSE_VELOCITY;
    else if (ev.key === "ArrowRight") vx = KEYBOARD_IMPULSE_VELOCITY;
    else if (ev.key === "ArrowUp") vy = -KEYBOARD_IMPULSE_VELOCITY;
    else if (ev.key === "ArrowDown") vy = KEYBOARD_IMPULSE_VELOCITY;
    else return;

    ev.preventDefault();
    setKeyboardFocusVisible(true);
    const target = physicsRef.current[selectedIdxRef.current];
    if (target) {
      target.velX += vx;
      target.velY += vy;
      wakeLoop();
    }
  };

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - safeScore / 100);

  return (
    <div className={styles.section}>
      {/* Native controls outside the artwork stage */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsMeta}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
          <span>
            {reducedMotion
              ? isEs
                ? "Resumen interactivo (movimiento reducido activo)"
                : "Interactive overview (reduced motion enabled)"
              : isEs
              ? "Desliza el cursor o usa flechas + Espacio para impulsar las tarjetas"
              : "Sweep pointer or use Arrow keys + Space to impulse widgets"}
          </span>
        </div>

        <div className={styles.controlsGroup}>
          <button
            type="button"
            disabled={reducedMotion}
            onClick={() => setPaused((prev) => !prev)}
            className={styles.controlBtn}
            aria-pressed={paused}
          >
            {paused ? (
              <>
                <Play className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                <span>{isEs ? "Reanudar" : "Play"}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                <span>{isEs ? "Pausar" : "Pause"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetScene}
            className={styles.controlBtn}
          >
            <RotateCcw className="w-3.5 h-3.5 text-violet-300" aria-hidden="true" />
            <span>{isEs ? "Reiniciar" : "Replay"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Physics Stage */}
      <div
        ref={stageRef}
        role="group"
        tabIndex={0}
        aria-label={
          isEs
            ? `Resumen físico interactivo de resultados para ${role}. Puntuación ${safeScore} de 100. Usa las flechas para mover el elemento seleccionado y Espacio para cambiar de elemento.`
            : `Interactive physics results stage for ${role}. Score ${safeScore} of 100. Use arrow keys to impulse selected widget and Space to cycle selection.`
        }
        className={styles.stage}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={() => {
          lastPointerRef.current = null;
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setKeyboardFocusVisible(false)}
      >
        {/* Fixed oversized pale-lavender typography */}
        <div aria-hidden="true" className={styles.bgWord}>
          <span className={styles.bgWordText}>DEVCAREER</span>
        </div>

        {/* Widget 0: Central Score Ring Frame */}
        <div
          ref={(el) => {
            widgetElsRef.current[0] = el;
          }}
          className={`${styles.widgetAnchor} ${
            keyboardFocusVisible && selectedIdx === 0 ? styles.widgetSelected : ""
          }`}
          style={{ zIndex: 3 }}
        >
          <div className={styles.widgetInner}>
            <div className={styles.heroCard}>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">
                {isEs ? "Puntaje Global" : "Overall Score"}
              </span>

              <div className="relative flex items-center justify-center w-[62%] aspect-square">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                  <defs>
                    <linearGradient id="pulseHeroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="55%" stopColor={tier.color} />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.09)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#pulseHeroRing)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
                    {safeScore}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">/100</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-400/35 text-indigo-200 truncate max-w-full">
                {tier.label}
              </span>
            </div>
          </div>
        </div>

        {/* Widget 1: Tilted DevCareer Interview Pass Ticket (-12deg) */}
        <div
          ref={(el) => {
            widgetElsRef.current[1] = el;
          }}
          className={`${styles.widgetAnchor} ${
            keyboardFocusVisible && selectedIdx === 1 ? styles.widgetSelected : ""
          }`}
          style={{ zIndex: 2 }}
        >
          <div className={styles.widgetInner}>
            <div className={styles.ticketCard}>
              <div className="flex items-center justify-between gap-1 border-b border-black/15 pb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider">
                  DEVCAREER PASS
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/15">
                  {level || "AI"}
                </span>
              </div>

              <div className="my-auto py-1">
                <p className="text-[11px] sm:text-xs font-extrabold leading-tight line-clamp-2 capitalize">
                  {role}
                </p>
                <p className="text-[9px] font-semibold opacity-75 mt-1 truncate">
                  {formattedDate}
                </p>
              </div>

              {/* Code-native SVG barcode */}
              <div className="pt-1.5 border-t border-black/15">
                <svg
                  viewBox="0 0 120 26"
                  className="w-full h-5"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  {[2, 8, 13, 21, 25, 31, 40, 44, 51, 58, 63, 70, 77, 82, 88, 96, 102, 110, 115].map(
                    (x, idx) => (
                      <rect
                        key={x}
                        x={x}
                        y="2"
                        width={idx % 3 === 0 ? 3.5 : idx % 2 === 0 ? 2 : 1.3}
                        height="22"
                        fill="#0b0d17"
                        rx="0.5"
                      />
                    )
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Periwinkle/Indigo Circular Best-Competency Badge */}
        <div
          ref={(el) => {
            widgetElsRef.current[2] = el;
          }}
          className={`${styles.widgetAnchor} ${
            keyboardFocusVisible && selectedIdx === 2 ? styles.widgetSelected : ""
          }`}
          style={{ zIndex: 4 }}
        >
          <div className={styles.widgetInner}>
            <div className={styles.circleCard}>
              <span className="text-[8px] font-extrabold uppercase tracking-wider opacity-75">
                {isEs ? "Top" : "Best"}
              </span>
              <span className="text-lg sm:text-2xl font-black tabular-nums leading-none mt-0.5">
                {bestCategory ? bestCategory.score : safeScore}
              </span>
              <span className="text-[8px] font-bold leading-tight mt-0.5 line-clamp-1 max-w-[90%]">
                {bestCategory
                  ? bestCategory.name.split(" ")[0]
                  : `${strengthsCount}+`}
              </span>
            </div>
          </div>
        </div>

        {/* Widget 3: Dark Competency Waveform Block */}
        <div
          ref={(el) => {
            widgetElsRef.current[3] = el;
          }}
          className={`${styles.widgetAnchor} ${
            keyboardFocusVisible && selectedIdx === 3 ? styles.widgetSelected : ""
          }`}
          style={{ zIndex: 2 }}
        >
          <div className={styles.widgetInner}>
            <div className={styles.waveCard}>
              <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300">
                <span className="uppercase tracking-wider font-bold">
                  {isEs ? "Competencias" : "Signals"}
                </span>
                <span>{categoryScores.length || 5}x</span>
              </div>

              <svg
                viewBox="0 0 140 52"
                className="w-full h-[65%]"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="pulseWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#cac5fe" />
                    <stop offset="55%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                {barValues.map((val, idx) => {
                  const slot = 140 / barValues.length;
                  const barW = Math.max(8, slot * 0.52);
                  const barH = Math.max(6, (val / 100) * 44);
                  const x = idx * slot + (slot - barW) / 2;
                  const y = (52 - barH) / 2;
                  return (
                    <rect
                      key={idx}
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={barW / 2}
                      fill="url(#pulseWaveGrad)"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
