"use client";

import { useEffect, useRef, useState } from "react";
import { startVoid, startVoidCanvas2D } from "@/lib/volumetric-word-void";

interface VolumetricHeroBackdropProps {
  /** Word rendered into the volumetric light mask. */
  word?: string;
}

type RenderMode = "webgl2" | "canvas2d" | "static";

/**
 * Interactive volumetric typography lighting layer scoped to its parent Hero section.
 * - Uses native WebGL2 ray-marching when available.
 * - Automatically falls back to an interactive Canvas 2D volumetric god-ray engine
 *   if WebGL2 is disabled, fails shader compilation, or loses context.
 * - Leaves the host page's <h1>, CTA, and cards accessible (aria-hidden="true").
 */
export default function VolumetricHeroBackdrop({
  word = "DEVCAREER",
}: VolumetricHeroBackdropProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("webgl2");

  useEffect(() => {
    if (renderMode === "static") return;

    const canvas = canvasRef.current;
    const hostSection = containerRef.current?.parentElement ?? containerRef.current;
    if (!canvas || !hostSection) return;

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setRenderMode("canvas2d");
    };

    if (renderMode === "webgl2") {
      canvas.addEventListener("webglcontextlost", onContextLost, false);
      const cleanup = startVoid(canvas, word, {
        interactionTarget: hostSection,
        fontWeight: 600,
      });

      if (!cleanup) {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        let active = true;
        Promise.resolve().then(() => {
          if (active) setRenderMode("canvas2d");
        });
        return () => {
          active = false;
        };
      }

      return () => {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        cleanup();
      };
    }

    const cleanup2d = startVoidCanvas2D(canvas, word, {
      interactionTarget: hostSection,
      fontWeight: 600,
    });

    if (!cleanup2d) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) setRenderMode("static");
      });
      return () => {
        active = false;
      };
    }

    return () => {
      cleanup2d();
    };
  }, [word, renderMode]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden rounded-3xl bg-[#010101] pointer-events-none select-none"
    >
      {renderMode === "static" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#010101]">
          <span className="font-semibold tracking-[-0.02em] text-zinc-800/70 text-6xl sm:text-8xl md:text-[7.5rem] leading-none">
            {word}
          </span>
        </div>
      ) : (
        <canvas
          key={renderMode}
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block w-full h-full"
        />
      )}

      {/* Subtle readability scrim preserving high contrast for hero copy & CTA without washing out rays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050509]/55 via-[#050509]/15 to-[#050509]/30" />
    </div>
  );
}
