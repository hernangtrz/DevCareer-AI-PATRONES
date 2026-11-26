"use client";

import React, { useEffect, useRef } from "react";

interface StardustCursorBackdropProps {
  children: React.ReactNode;
  className?: string;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  colorIndex: number;
  twinklePhase: number;
  twinkleSpeed: number;
  ambient: boolean;
  drag: number;
}

const STARDUST_COLORS = [
  { core: "rgba(255, 255, 255, 1)", mid: "rgba(224, 231, 255, 0.72)", edge: "rgba(129, 140, 248, 0)" },
  { core: "rgba(238, 242, 255, 1)", mid: "rgba(167, 139, 250, 0.72)", edge: "rgba(139, 92, 246, 0)" },
  { core: "rgba(253, 242, 248, 1)", mid: "rgba(244, 114, 182, 0.7)", edge: "rgba(255, 34, 136, 0)" },
  { core: "rgba(224, 242, 254, 1)", mid: "rgba(56, 189, 248, 0.68)", edge: "rgba(56, 126, 240, 0)" },
  { core: "rgba(245, 243, 255, 1)", mid: "rgba(196, 181, 253, 0.68)", edge: "rgba(99, 102, 241, 0)" },
] as const;

const GRID_COLS = 44;
const GRID_ROWS = 18;
const MAX_ACTIVE_PARTICLES = 460;
const AMBIENT_COUNT = 78;

function createGlowSprites(): HTMLCanvasElement[] {
  return STARDUST_COLORS.map(({ core, mid, edge }) => {
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

export default function StardustCursorBackdrop({
  children,
  className = "",
}: StardustCursorBackdropProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprites = createGlowSprites();

    let width = Math.max(1, container.clientWidth);
    let height = Math.max(1, container.clientHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const gridSize = GRID_COLS * GRID_ROWS;
    const vxGrid = new Float32Array(gridSize);
    const vyGrid = new Float32Array(gridSize);
    const vxNext = new Float32Array(gridSize);
    const vyNext = new Float32Array(gridSize);

    const particles: DustParticle[] = [];

    const spawnAmbient = (w: number, h: number): DustParticle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -0.04 - Math.random() * 0.12,
      size: 0.9 + Math.random() * 1.45,
      alpha: 0.18 + Math.random() * 0.34,
      life: Math.random() * 100,
      maxLife: 100,
      colorIndex: Math.floor(Math.random() * STARDUST_COLORS.length),
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.03,
      ambient: true,
      drag: 0.96,
    });

    const resetAmbientField = () => {
      particles.length = 0;
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        particles.push(spawnAmbient(width, height));
      }
    };

    const renderStaticReducedFrame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        if (!p.ambient) continue;
        const sprite = sprites[p.colorIndex];
        const drawSize = p.size * 5.2;
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.drawImage(sprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const resizeCanvas = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (particles.length === 0) {
        resetAmbientField();
      }
      if (reducedMotionQuery.matches) {
        renderStaticReducedFrame();
      }
    };

    resizeCanvas();

    const injectFluidImpulse = (
      x: number,
      y: number,
      fx: number,
      fy: number,
      radiusCells: number
    ) => {
      const gx = (x / width) * (GRID_COLS - 1);
      const gy = (y / height) * (GRID_ROWS - 1);
      const minX = Math.max(0, Math.floor(gx - radiusCells));
      const maxX = Math.min(GRID_COLS - 1, Math.ceil(gx + radiusCells));
      const minY = Math.max(0, Math.floor(gy - radiusCells));
      const maxY = Math.min(GRID_ROWS - 1, Math.ceil(gy + radiusCells));
      const rSq = radiusCells * radiusCells;

      for (let cy = minY; cy <= maxY; cy++) {
        const dy = cy - gy;
        for (let cx = minX; cx <= maxX; cx++) {
          const dx = cx - gx;
          const distSq = dx * dx + dy * dy;
          if (distSq > rSq) continue;
          const weight = Math.exp(-distSq / (rSq * 0.45));
          const idx = cy * GRID_COLS + cx;
          vxGrid[idx] += fx * weight;
          vyGrid[idx] += fy * weight;
        }
      }
    };

    const injectVortexCurl = (
      x: number,
      y: number,
      strength: number,
      radiusCells: number
    ) => {
      const gx = (x / width) * (GRID_COLS - 1);
      const gy = (y / height) * (GRID_ROWS - 1);
      const minX = Math.max(0, Math.floor(gx - radiusCells));
      const maxX = Math.min(GRID_COLS - 1, Math.ceil(gx + radiusCells));
      const minY = Math.max(0, Math.floor(gy - radiusCells));
      const maxY = Math.min(GRID_ROWS - 1, Math.ceil(gy + radiusCells));
      const rSq = radiusCells * radiusCells;

      for (let cy = minY; cy <= maxY; cy++) {
        const dy = cy - gy;
        for (let cx = minX; cx <= maxX; cx++) {
          const dx = cx - gx;
          const distSq = dx * dx + dy * dy;
          if (distSq > rSq || distSq < 0.01) continue;
          const dist = Math.sqrt(distSq);
          const weight = Math.exp(-distSq / (rSq * 0.5)) * strength;
          const idx = cy * GRID_COLS + cx;
          // Tangential swirl around vortex center
          vxGrid[idx] += (-dy / dist) * weight;
          vyGrid[idx] += (dx / dist) * weight;
        }
      }
    };

    const sampleFluid = (x: number, y: number): [number, number] => {
      const fx = Math.max(0, Math.min(GRID_COLS - 1.001, (x / width) * (GRID_COLS - 1)));
      const fy = Math.max(0, Math.min(GRID_ROWS - 1.001, (y / height) * (GRID_ROWS - 1)));
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;

      const i00 = y0 * GRID_COLS + x0;
      const i10 = i00 + 1;
      const i01 = i00 + GRID_COLS;
      const i11 = i01 + 1;

      const vx =
        (vxGrid[i00] * (1 - tx) + vxGrid[i10] * tx) * (1 - ty) +
        (vxGrid[i01] * (1 - tx) + vxGrid[i11] * tx) * ty;
      const vy =
        (vyGrid[i00] * (1 - tx) + vyGrid[i10] * tx) * (1 - ty) +
        (vyGrid[i01] * (1 - tx) + vyGrid[i11] * tx) * ty;

      return [vx, vy];
    };

    const trimTransientParticles = () => {
      let overflow = particles.length - MAX_ACTIVE_PARTICLES;
      if (overflow <= 0) return;
      for (let i = 0; i < particles.length && overflow > 0; i++) {
        if (!particles[i].ambient) {
          particles.splice(i, 1);
          i--;
          overflow--;
        }
      }
    };

    const emitWakeDust = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      speed: number
    ) => {
      const count = Math.min(9, Math.max(2, Math.floor(speed * 0.28)));
      const nx = speed > 0.1 ? -dy / speed : 0;
      const ny = speed > 0.1 ? dx / speed : 0;

      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const spread = (Math.random() - 0.5) * (10 + Math.min(speed, 28) * 0.45);
        const px = x - dx * t + nx * spread;
        const py = y - dy * t + ny * spread;
        const curlSign = spread >= 0 ? 1 : -1;

        particles.push({
          x: px,
          y: py,
          vx: dx * (0.045 + Math.random() * 0.05) + nx * curlSign * (0.25 + Math.random() * 0.55),
          vy: dy * (0.045 + Math.random() * 0.05) + ny * curlSign * (0.25 + Math.random() * 0.55) - 0.08,
          size: 0.75 + Math.random() * 1.95,
          alpha: 0.52 + Math.random() * 0.45,
          life: 0,
          maxLife: 42 + Math.random() * 48,
          colorIndex: Math.floor(Math.random() * STARDUST_COLORS.length),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.12 + Math.random() * 0.18,
          ambient: false,
          drag: 0.955 + Math.random() * 0.025,
        });
      }
      trimTransientParticles();
    };

    const emitMushroomPuff = (x: number, y: number) => {
      // Twin counter-rotating vortices + upward jet create a mushroom-cloud puff
      injectFluidImpulse(x, y, 0, -3.4, 2.8);
      injectVortexCurl(x - 24, y - 16, 2.9, 3.2);
      injectVortexCurl(x + 24, y - 16, -2.9, 3.2);

      // Rounded mushroom cap plume
      const capCount = 46;
      for (let i = 0; i < capCount; i++) {
        const arc = -Math.PI + (i / (capCount - 1)) * Math.PI;
        const jitter = (Math.random() - 0.5) * 0.25;
        const angle = arc + jitter;
        const radialSpeed = 1.15 + Math.random() * 2.35;
        const vx = Math.cos(angle) * radialSpeed * 1.18;
        const vy = Math.sin(angle) * radialSpeed * 0.85 - 0.95;

        particles.push({
          x: x + Math.cos(angle) * (4 + Math.random() * 9),
          y: y + Math.sin(angle) * (3 + Math.random() * 6),
          vx,
          vy,
          size: 0.95 + Math.random() * 2.3,
          alpha: 0.72 + Math.random() * 0.28,
          life: 0,
          maxLife: 56 + Math.random() * 44,
          colorIndex: Math.floor(Math.random() * STARDUST_COLORS.length),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.14 + Math.random() * 0.22,
          ambient: false,
          drag: 0.952 + Math.random() * 0.02,
        });
      }

      // Rising stem dust drawn into the puff
      const stemCount = 20;
      for (let i = 0; i < stemCount; i++) {
        const stemProgress = i / stemCount;
        particles.push({
          x: x + (Math.random() - 0.5) * (10 + stemProgress * 12),
          y: y + stemProgress * 18,
          vx: (Math.random() - 0.5) * 0.75,
          vy: -(0.85 + Math.random() * 1.9),
          size: 0.75 + Math.random() * 1.75,
          alpha: 0.55 + Math.random() * 0.4,
          life: 0,
          maxLife: 46 + Math.random() * 34,
          colorIndex: Math.floor(Math.random() * STARDUST_COLORS.length),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.15 + Math.random() * 0.2,
          ambient: false,
          drag: 0.96,
        });
      }

      trimTransientParticles();
    };

    let lastPointerX: number | null = null;
    let lastPointerY: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (lastPointerX === null || lastPointerY === null) {
        lastPointerX = x;
        lastPointerY = y;
        return;
      }

      const dx = x - lastPointerX;
      const dy = y - lastPointerY;
      const speed = Math.hypot(dx, dy);

      if (speed > 0.6) {
        const clampedDx = Math.max(-42, Math.min(42, dx));
        const clampedDy = Math.max(-42, Math.min(42, dy));
        injectFluidImpulse(x, y, clampedDx * 0.11, clampedDy * 0.11, 2.4);
        // Subtle trailing wake swirl
        injectVortexCurl(
          x - clampedDx * 0.4,
          y - clampedDy * 0.4,
          Math.min(1.1, speed * 0.03) * (clampedDx >= 0 ? 1 : -1),
          2.0
        );
        emitWakeDust(x, y, clampedDx, clampedDy, speed);
      }

      lastPointerX = x;
      lastPointerY = y;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      emitMushroomPuff(x, y);
      lastPointerX = x;
      lastPointerY = y;
    };

    const handlePointerLeave = () => {
      lastPointerX = null;
      lastPointerY = null;
    };

    const stepFluidGrid = () => {
      const damping = 0.925;
      const diffuse = 0.14;

      for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
          const idx = cy * GRID_COLS + cx;
          const left = cx > 0 ? idx - 1 : idx;
          const right = cx < GRID_COLS - 1 ? idx + 1 : idx;
          const up = cy > 0 ? idx - GRID_COLS : idx;
          const down = cy < GRID_ROWS - 1 ? idx + GRID_COLS : idx;

          const avgVx = (vxGrid[left] + vxGrid[right] + vxGrid[up] + vxGrid[down]) * 0.25;
          const avgVy = (vyGrid[left] + vyGrid[right] + vyGrid[up] + vyGrid[down]) * 0.25;

          vxNext[idx] = (vxGrid[idx] * (1 - diffuse) + avgVx * diffuse) * damping;
          vyNext[idx] = (vyGrid[idx] * (1 - diffuse) + avgVy * diffuse) * damping;
        }
      }

      vxGrid.set(vxNext);
      vyGrid.set(vyNext);
    };

    let rafId = 0;
    let isVisible = true;

    const tick = () => {
      if (!isVisible || document.hidden || reducedMotionQuery.matches) {
        rafId = 0;
        return;
      }

      stepFluidGrid();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const [fvx, fvy] = sampleFluid(p.x, p.y);

        if (p.ambient) {
          p.vx = p.vx * p.drag + fvx * 0.14 + (Math.random() - 0.5) * 0.015;
          p.vy = p.vy * p.drag + fvy * 0.14 - 0.004;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;
          if (p.y < -8) p.y = height + 8;
          if (p.y > height + 8) p.y = -8;

          p.twinklePhase += p.twinkleSpeed;
          const wakeBoost = Math.min(0.55, Math.hypot(fvx, fvy) * 0.25);
          const twinkle = 0.65 + 0.35 * Math.sin(p.twinklePhase);
          const finalAlpha = Math.min(0.92, (p.alpha + wakeBoost) * twinkle);

          const sprite = sprites[p.colorIndex];
          const drawSize = p.size * (5.2 + wakeBoost * 2.6);
          ctx.globalAlpha = finalAlpha;
          ctx.drawImage(sprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
        } else {
          p.life += 1;
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
          }

          p.vx = p.vx * p.drag + fvx * 0.24;
          p.vy = p.vy * p.drag + fvy * 0.24 - 0.012;
          p.x += p.vx;
          p.y += p.vy;

          p.twinklePhase += p.twinkleSpeed;
          const progress = p.life / p.maxLife;
          const fadeIn = Math.min(1, progress * 7);
          const fadeOut = Math.pow(1 - progress, 1.55);
          const twinkle = 0.72 + 0.28 * Math.sin(p.twinklePhase);
          const finalAlpha = p.alpha * fadeIn * fadeOut * twinkle;

          if (finalAlpha > 0.01) {
            const sprite = sprites[p.colorIndex];
            const drawSize = p.size * (5.6 - progress * 2.1);
            ctx.globalAlpha = finalAlpha;
            ctx.drawImage(sprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (reducedMotionQuery.matches) {
        renderStaticReducedFrame();
        return;
      }
      if (!rafId && isVisible && !document.hidden) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) startLoop();
      },
      { threshold: 0.02 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      if (!document.hidden) startLoop();
    };

    const handleReducedMotionChange = () => {
      if (reducedMotionQuery.matches) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        renderStaticReducedFrame();
      } else {
        startLoop();
      }
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerdown", handlePointerDown, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    startLoop();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative -mx-3 px-3 py-2 sm:-mx-4 sm:px-4 ${className}`}
    >
      {/* Scoped stardust fluid-wake canvas layer (non-focusable, pointer-events-none) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, #000 7%, #000 92%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0%, #000 7%, #000 92%, transparent 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 70% at 18% 20%, rgba(99, 102, 241, 0.11) 0%, transparent 70%), radial-gradient(50% 65% at 84% 72%, rgba(244, 114, 182, 0.08) 0%, transparent 72%)",
          }}
        />
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* Foreground interactive content */}
      <div className="relative z-10 flex flex-col gap-6">{children}</div>
    </div>
  );
}
