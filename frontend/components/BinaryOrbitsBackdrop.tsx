"use client";

import React, { useEffect, useRef } from "react";

interface BinaryOrbitsBackdropProps {
  className?: string;
}

interface GalaxyStar {
  /** Radial distance in normalized galaxy units [0.06..1.18] */
  radius: number;
  /** Current orbital angle along the tilted spiral plane */
  angle: number;
  /** Vertical disk thickness offset */
  zOffset: number;
  /** Orbital angular velocity (Keplerian falloff: faster near core) */
  angularSpeed: number;
  /** Star base radius in px */
  size: number;
  /** Sprite color slot */
  colorIndex: number;
  /** Harmonic twinkle phase & speed */
  twinklePhase: number;
  twinkleSpeed: number;
  /** Whether star renders a subtle orbital stream tail */
  streaming: boolean;
}

const GALAXY_COLORS = [
  { core: "rgba(255, 255, 255, 1)", mid: "rgba(202, 197, 254, 0.78)", edge: "rgba(99, 102, 241, 0)" },
  { core: "rgba(238, 242, 255, 1)", mid: "rgba(129, 140, 248, 0.76)", edge: "rgba(79, 70, 229, 0)" },
  { core: "rgba(245, 243, 255, 1)", mid: "rgba(167, 139, 250, 0.74)", edge: "rgba(139, 92, 246, 0)" },
  { core: "rgba(236, 254, 255, 1)", mid: "rgba(34, 211, 238, 0.72)", edge: "rgba(6, 182, 212, 0)" },
  { core: "rgba(236, 253, 245, 1)", mid: "rgba(52, 211, 153, 0.7)", edge: "rgba(16, 185, 129, 0)" },
  { core: "rgba(253, 244, 255, 1)", mid: "rgba(232, 121, 249, 0.68)", edge: "rgba(217, 70, 239, 0)" },
] as const;

const STAR_COUNT = 460;
const ARM_COUNT = 2; // Twin primary binary spiral arms with secondary filaments

function createStarSprites(): HTMLCanvasElement[] {
  return GALAXY_COLORS.map(({ core, mid, edge }) => {
    const sprite = document.createElement("canvas");
    const size = 24;
    sprite.width = size;
    sprite.height = size;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const half = size / 2;
      const grad = sctx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, core);
      grad.addColorStop(0.28, mid);
      grad.addColorStop(1, edge);
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, size, size);
    }
    return sprite;
  });
}

function buildGalaxyStars(): GalaxyStar[] {
  const stars: GalaxyStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const isHalo = i >= STAR_COUNT * 0.84;
    const u = Math.random();
    const radius = isHalo
      ? 0.22 + Math.pow(u, 0.85) * 1.02
      : 0.07 + Math.pow(u, 0.76) * 1.06;

    const armIdx = i % ARM_COUNT;
    const armBase = (armIdx * Math.PI * 2) / ARM_COUNT;
    // Logarithmic spiral twist winding outward from the binary center
    const spiralTwist = radius * 4.35;
    const armScatter = isHalo
      ? (Math.random() - 0.5) * Math.PI * 2
      : (Math.random() - 0.5) * (0.42 + radius * 0.55);

    const angle = armBase + spiralTwist + armScatter;
    const angularSpeed = (0.0014 + Math.random() * 0.0009) / Math.pow(radius + 0.18, 0.68);
    const zOffset = (Math.random() - 0.5) * (isHalo ? 0.18 : 0.055) * (1 - radius * 0.35);

    // Inner core leans bright white/indigo/cyan; outer arms blend violet/emerald/fuchsia
    let colorIndex: number;
    if (radius < 0.32) {
      colorIndex = Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : 3;
    } else if (armIdx === 0) {
      const r = Math.random();
      colorIndex = r < 0.35 ? 1 : r < 0.65 ? 2 : r < 0.85 ? 0 : 5;
    } else {
      const r = Math.random();
      colorIndex = r < 0.38 ? 3 : r < 0.68 ? 4 : r < 0.86 ? 0 : 1;
    }

    stars.push({
      radius,
      angle,
      zOffset,
      angularSpeed,
      size: 0.7 + Math.pow(Math.random(), 1.55) * 1.9,
      colorIndex,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.025 + Math.random() * 0.06,
      streaming: !isHalo && Math.random() < 0.42,
    });
  }
  return stars;
}

export default function BinaryOrbitsBackdrop({
  className = "",
}: BinaryOrbitsBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprites = createStarSprites();
    const stars = buildGalaxyStars();

    let width = 1;
    let height = 1;
    let dpr = 1;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let binaryPhase = 0.65;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const projectPoint = (
      gx: number,
      gy: number,
      gz: number,
      cx: number,
      cy: number,
      scaleR: number,
      tiltX: number,
      rollZ: number
    ) => {
      // Apply disk roll in galaxy plane
      const cosRoll = Math.cos(rollZ);
      const sinRoll = Math.sin(rollZ);
      const rx = gx * cosRoll - gy * sinRoll;
      const ry = gx * sinRoll + gy * cosRoll;

      // Tilt galaxy plane toward viewer around X-axis
      const cosTilt = Math.cos(tiltX);
      const sinTilt = Math.sin(tiltX);
      const ty = ry * cosTilt - gz * sinTilt;
      const tz = ry * sinTilt + gz * cosTilt;

      const perspective = 1.65 / (2.25 - tz * 0.72);
      return {
        x: cx + rx * scaleR * perspective,
        y: cy + ty * scaleR * perspective,
        depth: tz,
        perspective,
      };
    };

    const renderFrame = (advance: boolean) => {
      pointerX += (pointerTargetX - pointerX) * 0.04;
      pointerY += (pointerTargetY - pointerY) * 0.04;

      if (advance) {
        binaryPhase += 0.0075;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const cx = width * 0.54 + pointerX * 26;
      const cy = height * 0.44 + pointerY * 18;
      const scaleR = Math.min(width, height) * 0.54;
      const tiltX = 1.04 + pointerY * 0.08; // ~60° tilted galactic disk
      const rollZ = -0.28 + pointerX * 0.06;

      // Subtle tilted galactic arm nebula haze
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rollZ);
      ctx.scale(1, Math.cos(tiltX));
      const nebula = ctx.createRadialGradient(0, 0, 0, 0, 0, scaleR * 0.95);
      nebula.addColorStop(0, "rgba(129, 140, 248, 0.14)");
      nebula.addColorStop(0.32, "rgba(99, 102, 241, 0.07)");
      nebula.addColorStop(0.65, "rgba(16, 185, 129, 0.035)");
      nebula.addColorStop(1, "rgba(2, 4, 8, 0)");
      ctx.fillStyle = nebula;
      ctx.beginPath();
      ctx.arc(0, 0, scaleR * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Orbiting twin binary cores at the galactic center
      const coreOrbitR = 0.075;
      const cores = [
        {
          angle: binaryPhase,
          color: "rgba(165, 180, 252, 0.85)",
          halo: "rgba(99, 102, 241, 0.34)",
          size: 32,
        },
        {
          angle: binaryPhase + Math.PI,
          color: "rgba(103, 232, 249, 0.82)",
          halo: "rgba(16, 185, 129, 0.28)",
          size: 28,
        },
      ];

      for (const core of cores) {
        const p = projectPoint(
          Math.cos(core.angle) * coreOrbitR,
          Math.sin(core.angle) * coreOrbitR,
          0,
          cx,
          cy,
          scaleR,
          tiltX,
          rollZ
        );
        const r = core.size * p.perspective;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, "rgba(255, 255, 255, 0.92)");
        g.addColorStop(0.24, core.color);
        g.addColorStop(0.6, core.halo);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render spiral arm stars streaming along tilted orbits
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (advance) {
          s.angle += s.angularSpeed;
          s.twinklePhase += s.twinkleSpeed;
        }

        const gx = Math.cos(s.angle) * s.radius;
        const gy = Math.sin(s.angle) * s.radius;
        const p = projectPoint(gx, gy, s.zOffset, cx, cy, scaleR, tiltX, rollZ);

        if (p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) {
          continue;
        }

        const depthFactor = Math.max(0.22, Math.min(1, 0.62 + p.depth * 0.45));
        const edgeFade = Math.max(0.15, 1 - Math.max(0, s.radius - 0.82) * 2.1);
        const twinkle = 0.68 + 0.32 * Math.sin(s.twinklePhase);
        const alpha = Math.min(0.88, depthFactor * edgeFade * twinkle * 0.78);

        if (s.streaming && alpha > 0.16) {
          const tailAngle = s.angle - s.angularSpeed * 18;
          const prev = projectPoint(
            Math.cos(tailAngle) * s.radius,
            Math.sin(tailAngle) * s.radius,
            s.zOffset,
            cx,
            cy,
            scaleR,
            tiltX,
            rollZ
          );
          const streakGrad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
          const col = GALAXY_COLORS[s.colorIndex];
          streakGrad.addColorStop(0, col.edge);
          streakGrad.addColorStop(1, col.mid);
          ctx.strokeStyle = streakGrad;
          ctx.globalAlpha = alpha * 0.55;
          ctx.lineWidth = Math.max(0.65, s.size * 0.52 * p.perspective);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        const sprite = sprites[s.colorIndex];
        const drawSize = s.size * 5.4 * p.perspective;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
      }

      ctx.globalAlpha = 1;
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
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 54% 42%, rgba(99, 102, 241, 0.11) 0%, rgba(16, 185, 129, 0.05) 42%, transparent 74%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{
          WebkitMaskImage:
            "radial-gradient(94% 90% at 52% 46%, #000 56%, transparent 100%)",
          maskImage:
            "radial-gradient(94% 90% at 52% 46%, #000 56%, transparent 100%)",
        }}
      />
    </div>
  );
}
