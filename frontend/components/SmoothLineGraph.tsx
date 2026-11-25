"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface SmoothGraphPoint {
  label: string;
  value: number;
  sublabel?: string;
}

interface SmoothLineGraphProps {
  data: SmoothGraphPoint[];
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit?: string;
  height?: number;
  animationKey?: number;
}

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Smooth animated cubic-spline line graph with:
 * - Synchronized left-to-right path & area reveal
 * - Continuous pointer/touch scrubbing with spring-eased crosshair & floating tooltip
 * - Dual-layer luminous DevCareer gradient stroke (indigo -> violet -> emerald)
 * - Keyboard Left/Right inspection and prefers-reduced-motion support
 */
export default function SmoothLineGraph({
  data,
  minValue = 50,
  maxValue = 100,
  targetValue = 80,
  unit = "pts",
  height = 228,
  animationKey = 0,
}: SmoothLineGraphProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const svgWidth = 540;
  const svgHeight = height;
  const padLeft = 36;
  const padRight = 22;
  const padTop = 34;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const { points, linePath, areaPath, gridValues, targetY } = useMemo(() => {
    const span = Math.max(1, maxValue - minValue);
    const pts = data.map((item, idx) => {
      const ratioX = data.length > 1 ? idx / (data.length - 1) : 0.5;
      const x = padLeft + ratioX * plotW;
      const clamped = Math.max(minValue, Math.min(maxValue, item.value));
      const y = padTop + (1 - (clamped - minValue) / span) * plotH;
      const prevVal = idx > 0 ? data[idx - 1].value : null;
      const delta = prevVal !== null ? item.value - prevVal : null;
      return { ...item, x, y, delta };
    });

    // Monotone-friendly smooth cubic Bezier curve
    const path = pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
      const prev = arr[i - 1];
      const dx = (pt.x - prev.x) * 0.45;
      return `${acc} C ${(prev.x + dx).toFixed(2)},${prev.y.toFixed(2)} ${(pt.x - dx).toFixed(2)},${pt.y.toFixed(2)} ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    }, "");

    const baselineY = svgHeight - padBottom;
    const area =
      pts.length > 0
        ? `${path} L ${pts[pts.length - 1].x.toFixed(2)},${baselineY.toFixed(2)} L ${pts[0].x.toFixed(2)},${baselineY.toFixed(2)} Z`
        : "";

    const tY =
      targetValue >= minValue && targetValue <= maxValue
        ? padTop + (1 - (targetValue - minValue) / span) * plotH
        : null;

    return {
      points: pts,
      linePath: path,
      areaPath: area,
      gridValues: [60, 70, 80, 90].filter((v) => v >= minValue && v <= maxValue),
      targetY: tY,
    };
  }, [data, maxValue, minValue, padBottom, padLeft, padTop, plotH, plotW, svgHeight, targetValue]);

  const handlePointerScrub = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return;

    const svgX = ((clientX - rect.left) / rect.width) * svgWidth;
    let nearest = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    setActiveIndex(nearest);
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (points.length === 0) return;
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : Math.min(points.length - 1, prev + 1)));
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      setActiveIndex((prev) => (prev === null ? points.length - 1 : Math.max(0, prev - 1)));
    } else if (ev.key === "Escape") {
      setActiveIndex(null);
    }
  };

  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const areaGradId = `sg-area-${rawId}`;
  const lineGradId = `sg-line-${rawId}`;
  const glowFilterId = `sg-glow-${rawId}`;
  const revealClipId = `sg-clip-${rawId}`;

  return (
    <div
      key={`smooth-graph-${animationKey}`}
      role="region"
      tabIndex={0}
      aria-label="Gráfico animado de evolución histórica. Usa las flechas izquierda y derecha o desliza el cursor para inspeccionar cada punto."
      onKeyDown={handleKeyDown}
      onBlur={() => setActiveIndex(null)}
      onPointerMove={(ev) => handlePointerScrub(ev.clientX)}
      onPointerDown={(ev) => handlePointerScrub(ev.clientX)}
      onPointerLeave={() => setActiveIndex(null)}
      className="relative w-full py-2 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 rounded-2xl touch-pan-y cursor-crosshair"
    >
      {/* Floating spring-tracked tooltip */}
      <AnimatePresence>
        {activePoint && (
          <motion.div
            key="sg-tooltip"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.94 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              left: `${Math.min(82, Math.max(18, (activePoint.x / svgWidth) * 100))}%`,
            }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
            transition={{
              left: { type: "spring", stiffness: 360, damping: 30 },
              opacity: { duration: 0.16 },
              scale: { duration: 0.16 },
            }}
            style={{ top: 4 }}
            className="pointer-events-none absolute -translate-x-1/2 z-20 px-3 py-1.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-400/35 shadow-xl shadow-indigo-950/60 backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap"
          >
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-medium text-zinc-400">
                {activePoint.sublabel || activePoint.label}
              </span>
              <span className="text-xs font-extrabold font-mono text-white">
                {activePoint.value} {unit}
              </span>
            </div>
            {activePoint.delta !== null && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  activePoint.delta >= 0
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                }`}
              >
                {activePoint.delta >= 0 ? `+${activePoint.delta}` : activePoint.delta}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-56 overflow-visible"
      >
        <defs>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.42" />
            <stop offset="55%" stopColor="#a855f7" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#11131c" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="52%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          <filter id={glowFilterId} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated left-to-right reveal clipPath synced with line draw */}
          <clipPath id={revealClipId}>
            <motion.rect
              x={0}
              y={0}
              height={svgHeight}
              initial={prefersReducedMotion ? { width: svgWidth } : { width: padLeft }}
              whileInView={{ width: svgWidth }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, delay: 0.1, ease: SMOOTH_EASE }}
            />
          </clipPath>
        </defs>

        {/* Horizontal grid lines */}
        {gridValues.map((val) => {
          const y = padTop + (1 - (val - minValue) / Math.max(1, maxValue - minValue)) * plotH;
          const isTarget = val === targetValue;
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={isTarget ? "rgba(52, 211, 153, 0.28)" : "rgba(255, 255, 255, 0.06)"}
                strokeWidth="1"
                strokeDasharray={isTarget ? "4 4" : undefined}
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                fill={isTarget ? "#6ee7b7" : "#71717a"}
                fontSize="9.5"
                fontFamily="monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Synchronized reveal group for area + luminous spline */}
        <g clipPath={`url(#${revealClipId})`}>
          {/* Soft area gradient under curve */}
          <path d={areaPath} fill={`url(#${areaGradId})`} />

          {/* Ambient glow layer */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            opacity="0.32"
            filter={`url(#${glowFilterId})`}
          />

          {/* Crisp primary smooth spline */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Subtle traveling energy shimmer along the curve when idle */}
          {!prefersReducedMotion && activePoint === null && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="34 620"
              opacity="0.65"
              animate={{ strokeDashoffset: [654, 0] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease: "easeInOut",
              }}
            />
          )}
        </g>

        {/* Target marker pill */}
        {targetY !== null && activePoint === null && (
          <text
            x={svgWidth - padRight}
            y={targetY - 5}
            textAnchor="end"
            fill="rgba(110, 231, 183, 0.7)"
            fontSize="8.5"
            fontFamily="monospace"
          >
            Meta {targetValue}
          </text>
        )}

        {/* Spring-driven vertical laser crosshair + active glowing bead */}
        {activePoint && (
          <g>
            <motion.line
              initial={false}
              animate={{ x1: activePoint.x, x2: activePoint.x }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              y1={padTop}
              y2={svgHeight - padBottom}
              stroke="rgba(192, 132, 252, 0.55)"
              strokeWidth="1.25"
              strokeDasharray="3 3"
            />
            {!prefersReducedMotion && (
              <motion.circle
                initial={false}
                animate={{
                  cx: activePoint.x,
                  cy: activePoint.y,
                  r: [10, 15, 10],
                  opacity: [0.45, 0.12, 0.45],
                }}
                transition={{
                  cx: { type: "spring", stiffness: 380, damping: 30 },
                  cy: { type: "spring", stiffness: 380, damping: 30 },
                  r: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                }}
                fill="#c084fc"
              />
            )}
            <motion.circle
              initial={false}
              animate={{ cx: activePoint.x, cy: activePoint.y }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              r="6.5"
              fill="#0b0d17"
              stroke="#34d399"
              strokeWidth="2.5"
            />
            <motion.circle
              initial={false}
              animate={{ cx: activePoint.x, cy: activePoint.y }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              r="2.8"
              fill="#ffffff"
            />
          </g>
        )}

        {/* Subtle resting milestone dots + X-axis date labels */}
        {points.map((pt, idx) => {
          const isLast = idx === points.length - 1;
          const isActive = activeIndex === idx;
          return (
            <g key={`${pt.label}-${idx}`}>
              {!isActive && (
                <motion.circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isLast ? 4.5 : 3.2}
                  fill="#11131c"
                  stroke={isLast ? "#34d399" : "#a855f7"}
                  strokeWidth="2"
                  style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                  initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: activeIndex !== null ? 0.45 : 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.35 + idx * 0.1 }}
                />
              )}

              {/* Subtle value label when not scrubbing */}
              {activeIndex === null && (
                <motion.text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fill={isLast ? "#6ee7b7" : "#e4e4e7"}
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                  whileInView={{ opacity: 0.9, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.45 + idx * 0.09 }}
                >
                  {pt.value}
                </motion.text>
              )}

              {/* X-axis label */}
              <text
                x={pt.x}
                y={svgHeight - padBottom + 18}
                textAnchor="middle"
                fill={isActive ? "#ffffff" : "#9ca3af"}
                fontSize="9.5"
                fontWeight={isActive ? "700" : "500"}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
