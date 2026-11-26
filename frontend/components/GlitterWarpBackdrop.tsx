"use client";

import React, { useEffect, useRef } from "react";

interface GlitterWarpBackdropProps {
  /** Accent palette synchronized with active Arena filter */
  mode?: "all" | "patterns";
  className?: string;
}

interface WarpStar {
  /** Unit radial direction around tunnel center */
  angle: number;
  /** Radial ring distance in normalized tunnel coordinates */
  radius: number;
  /** Depth along tunnel (0.04 = near camera, 1.0 = far vanishing point) */
  z: number;
  /** Previous depth for crisp warp streak tail */
  prevZ: number;
  /** Forward warp speed */
  speed: number;
  /** Base particle size */
  size: number;
  /** Glitter sparkle phase & frequency */
  glitterPhase: number;
  glitterSpeed: number;
  /** Palette slot (0..3) */
  colorSlot: number;
  /** Whether this star flashes a 4-point diamond glint at peak sparkle */
  hasFlare: boolean;
}

const PALETTES = {
  all: [
    [240, 249, 255], // starlight white-cyan
    [34, 211, 238],  // cyan-400
    [56, 189, 248],  // sky-400
    [129, 140, 248], // indigo-400
  ],
  patterns: [
    [238, 242, 255], // starlight lavender
    [129, 140, 248], // indigo-400
    [168, 85, 247],  // purple-500
    [217, 70, 239],  // fuchsia-500
  ],
} as const;

const STAR_COUNT = 280;

function createStar(randomDepth: boolean): WarpStar {
  // Bias radius slightly outward so tunnel feels open around the vanishing center
  const u = Math.random();
  const radius = 0.08 + Math.pow(u, 0.72) * 1.15;
  const z = randomDepth ? 0.06 + Math.random() * 0.94 : 0.86 + Math.random() * 0.14;
  return {
    angle: Math.random() * Math.PI * 2,
    radius,
    z,
    prevZ: z,
    speed: 0.0022 + Math.random() * 0.0036,
    size: 0.75 + Math.random() * 1.65,
    glitterPhase: Math.random() * Math.PI * 2,
    glitterSpeed: 0.06 + Math.random() * 0.16,
    colorSlot: Math.floor(Math.random() * 4),
    hasFlare: Math.random() < 0.32,
  };
}

export default function GlitterWarpBackdrop({
  mode = "all",
  className = "",
}: GlitterWarpBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetModeMixRef = useRef<number>(mode === "patterns" ? 1 : 0);

  useEffect(() => {
    targetModeMixRef.current = mode === "patterns" ? 1 : 0;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 1;
    let height = 1;
    let dpr = 1;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let modeMix = targetModeMixRef.current;

    const stars: WarpStar[] = Array.from({ length: STAR_COUNT }, () => createStar(true));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const getColor = (slot: number): [number, number, number] => {
      const a = PALETTES.all[slot];
      const b = PALETTES.patterns[slot];
      return [
        Math.round(a[0] + (b[0] - a[0]) * modeMix),
        Math.round(a[1] + (b[1] - a[1]) * modeMix),
        Math.round(a[2] + (b[2] - a[2]) * modeMix),
      ];
    };

    const drawDiamondFlare = (
      x: number,
      y: number,
      arm: number,
      r: number,
      g: number,
      b: number,
      alpha: number
    ) => {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.72})`;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    };

    const renderFrame = (advanceMotion: boolean) => {
      pointerX += (pointerTargetX - pointerX) * 0.045;
      pointerY += (pointerTargetY - pointerY) * 0.045;
      modeMix += (targetModeMixRef.current - modeMix) * 0.05;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const cx = width * 0.5 + pointerX * width * 0.06;
      const cy = height * 0.44 + pointerY * height * 0.05;
      const focal = Math.min(width, height) * 0.58;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (advanceMotion) {
          s.prevZ = s.z;
          // Accelerate gently as star nears the viewer for true warp perspective
          const depthBoost = 1 + (1 - s.z) * 1.45;
          s.z -= s.speed * depthBoost;
          s.glitterPhase += s.glitterSpeed;

          if (s.z <= 0.04) {
            stars[i] = createStar(false);
            continue;
          }
        }

        const cosA = Math.cos(s.angle);
        const sinA = Math.sin(s.angle);

        const projScale = focal / s.z;
        const x = cx + cosA * s.radius * projScale;
        const y = cy + sinA * s.radius * projScale;

        // Recycle stars that leave viewport bounds
        if (x < -80 || x > width + 80 || y < -80 || y > height + 80) {
          if (advanceMotion) {
            stars[i] = createStar(false);
          }
          continue;
        }

        // Previous projected position for the warp streak tail
        const trailZ = advanceMotion
          ? Math.min(1, s.z + s.speed * (3.6 + (1 - s.z) * 5.2))
          : Math.min(1, s.z + 0.02);
        const prevScale = focal / trailZ;
        const px = cx + cosA * s.radius * prevScale;
        const py = cy + sinA * s.radius * prevScale;

        // Depth fade-in from far center & glittering harmonic sparkle
        const depthAlpha = Math.min(1, (1 - s.z) * 1.55);
        const sparkleWave = 0.5 + 0.5 * Math.sin(s.glitterPhase);
        const glitterPulse = Math.pow(sparkleWave, 2.2);
        const alpha = Math.min(0.9, depthAlpha * (0.28 + glitterPulse * 0.62));
        if (alpha <= 0.015) continue;

        const [r, g, b] = getColor(s.colorSlot);
        const headRadius = Math.min(3.2, s.size * (0.45 + (1 - s.z) * 1.15) * (0.85 + glitterPulse * 0.45));

        // Draw warp streak tail
        const streakGrad = ctx.createLinearGradient(px, py, x, y);
        streakGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        streakGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.72})`);

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = Math.max(0.65, headRadius * 0.72);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw luminous star head
        ctx.fillStyle = `rgba(${Math.min(255, r + 35)}, ${Math.min(255, g + 35)}, ${Math.min(255, b + 35)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Glittering 4-point diamond flare at sparkle peak
        if (s.hasFlare && glitterPulse > 0.65 && depthAlpha > 0.35) {
          drawDiamondFlare(x, y, headRadius * (2.6 + glitterPulse * 1.6), r, g, b, alpha);
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    resize();

    let rafId = 0;

    const tick = () => {
      if (document.hidden || reducedMotionQuery.matches) {
        rafId = 0;
        return;
      }
      renderFrame(true);
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (reducedMotionQuery.matches) {
        renderFrame(false);
        return;
      }
      if (!rafId && !document.hidden) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      pointerTargetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerTargetY = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) startLoop();
    };

    const handleReducedMotionChange = () => {
      if (reducedMotionQuery.matches) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        renderFrame(false);
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotionQuery.matches) renderFrame(false);
    });
    resizeObserver.observe(canvas);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    startLoop();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 md:left-64 z-0 overflow-hidden ${className}`}
    >
      {/* Deep warp-tunnel ambient glow */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background:
            mode === "patterns"
              ? "radial-gradient(55% 48% at 50% 44%, rgba(99, 102, 241, 0.14) 0%, rgba(168, 85, 247, 0.06) 42%, transparent 74%)"
              : "radial-gradient(55% 48% at 50% 44%, rgba(6, 182, 212, 0.13) 0%, rgba(99, 102, 241, 0.06) 42%, transparent 74%)",
        }}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{
          WebkitMaskImage:
            "radial-gradient(95% 92% at 50% 46%, #000 58%, transparent 100%)",
          maskImage:
            "radial-gradient(95% 92% at 50% 46%, #000 58%, transparent 100%)",
        }}
      />
    </div>
  );
}
