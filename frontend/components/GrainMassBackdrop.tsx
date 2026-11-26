"use client";

import React, { useEffect, useRef } from "react";

interface GrainMassBackdropProps {
  /** Accent palette mode synchronized with the active CV Hub tab */
  mode?: "creator" | "analyzer";
  /** Number of overlapping silk particle sheets (default: 5) */
  layers?: number;
  /** Overall opacity multiplier (default: 0.72) */
  opacity?: number;
  className?: string;
}

const VERTEX_SHADER_SRC = `
  precision highp float;

  attribute vec4 a_uvLayerSeed; // x: u [0..1], y: v [-1..1], z: layerNorm [0..1], w: rand1 [0..1]
  attribute vec2 a_fuzzSize;    // x: signed edge fuzz, y: grain size [0.5..1.6]

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_dpr;
  uniform vec2 u_pointer;       // normalized [-1..1]
  uniform float u_modeMix;      // 0 = creator (indigo/violet/cyan), 1 = analyzer (fuchsia/violet/indigo)
  uniform float u_opacity;

  varying vec3 v_color;
  varying float v_alpha;

  void main() {
    float u = a_uvLayerSeed.x;
    float v = a_uvLayerSeed.y;
    float layerNorm = a_uvLayerSeed.z;
    float seed = a_uvLayerSeed.w;

    float layerPhase = layerNorm * 6.2831853 + seed * 0.22;
    float speed = 0.24 + layerNorm * 0.08;
    float t = u_time * speed;

    // Subtle strand alignment along v so grains read as woven silk threads
    float strandWave = sin(v * 26.0 + layerPhase) * 0.022;
    float vSheared = v + strandWave;

    // Organic billowing folds & rolling curl along the silk sheet
    float fold1 = sin(u * 5.2 - t * 1.15 + layerPhase) * 0.24;
    float fold2 = cos(u * 9.4 + t * 0.78 - layerPhase * 1.3) * 0.11;
    float billow = sin((u * 3.1 + vSheared * 1.45) - t * 0.92 + layerPhase) * 0.19;

    // Twisting cross-section around the spine of each silk ribbon
    float twistAngle = u * 3.8 + sin(u * 2.4 - t * 0.65 + layerPhase) * 1.35 + layerNorm * 1.5;
    float ribbonWidth = (0.28 + 0.11 * sin(u * 3.14159 + layerPhase)) * (1.0 + 0.14 * sin(t + u * 4.0));
    float offsetAcross = vSheared * ribbonWidth;

    // 3D ribbon coordinates
    float sweepX = (u - 0.5) * 2.38;
    float spineY = (layerNorm - 0.5) * 0.62
      + (u - 0.5) * -0.26
      + fold1
      + fold2 * 0.65
      + u_pointer.y * 0.06 * (0.4 + layerNorm);

    float posY = spineY + offsetAcross * cos(twistAngle) + billow * (0.45 + 0.55 * abs(v));
    float posZ = offsetAcross * sin(twistAngle) + cos(u * 4.5 - t * 0.85 + layerPhase) * 0.22 + (layerNorm - 0.5) * 0.35;

    // Edge fraying / silky fuzz outward along sheet margins
    float edgeMask = pow(abs(v), 2.1);
    float fuzzNoise = sin(seed * 73.1 + u * 19.0 - t * 1.4) * cos(seed * 41.7 + v * 11.0);
    posY += a_fuzzSize.x * edgeMask * 0.14 + fuzzNoise * 0.018;
    float posX = sweepX + u_pointer.x * 0.05 * (0.5 - layerNorm) + a_fuzzSize.x * edgeMask * 0.06;

    // Soft perspective projection
    float perspective = 1.0 / (1.58 - posZ * 0.42);
    vec2 clipPos = vec2(posX * perspective, posY * perspective);

    // Adjust slightly for tall viewports so silk still fills gracefully
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    if (aspect < 1.0) {
      clipPos.x *= 1.15;
    }

    gl_Position = vec4(clipPos, 0.0, 1.0);

    // Fold caustic boost: where the ribbon turns edge-on (cos(twistAngle) near 0), particles bunch & gleam
    float ridgeGleam = 1.0 - smoothstep(0.0, 0.85, abs(cos(twistAngle)));
    float depthFade = clamp(0.45 + (posZ + 0.5) * 0.55, 0.22, 1.0);

    // Feather ends of the sweep and ribbon edges
    float uFade = smoothstep(0.0, 0.14, u) * smoothstep(1.0, 0.86, u);
    float vFade = 1.0 - smoothstep(0.62, 1.05, abs(v));
    float twinkle = 0.74 + 0.26 * sin(u_time * (1.2 + seed * 1.8) + seed * 31.4);

    // DevCareer palette: Creator (indigo / lavender / violet / cyan) vs Analyzer (fuchsia / violet / rose / indigo)
    vec3 creatorA = vec3(0.39, 0.40, 0.95); // indigo-500
    vec3 creatorB = vec3(0.55, 0.36, 0.96); // violet-500
    vec3 creatorC = vec3(0.40, 0.91, 0.98); // cyan-300 highlight

    vec3 analyzerA = vec3(0.85, 0.27, 0.94); // fuchsia-500
    vec3 analyzerB = vec3(0.66, 0.33, 0.97); // purple-500
    vec3 analyzerC = vec3(0.96, 0.45, 0.71); // pink-400 highlight

    vec3 colA = mix(creatorA, analyzerA, u_modeMix);
    vec3 colB = mix(creatorB, analyzerB, u_modeMix);
    vec3 colC = mix(creatorC, analyzerC, u_modeMix);

    float colorMix = clamp(u * 0.65 + layerNorm * 0.35 + sin(v * 3.0 + layerPhase) * 0.12, 0.0, 1.0);
    vec3 baseCol = mix(colA, colB, colorMix);
    v_color = mix(baseCol, colC, clamp(ridgeGleam * 0.65 + seed * 0.18, 0.0, 0.85));

    float baseAlpha = (0.14 + ridgeGleam * 0.26) * depthFade * uFade * vFade * twinkle;
    v_alpha = baseAlpha * u_opacity;

    float ptSize = (1.15 + a_fuzzSize.y * 1.35 + ridgeGleam * 0.85) * perspective * u_dpr;
    gl_PointSize = clamp(ptSize, 1.0, 5.5 * u_dpr);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;

  varying vec3 v_color;
  varying float v_alpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    // Soft glowing grain core
    float radial = smoothstep(0.5, 0.06, dist);
    float alpha = radial * radial * v_alpha;
    gl_FragColor = vec4(v_color * alpha, alpha);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function buildParticleBuffers(layerCount: number, particlesPerLayer: number) {
  const total = layerCount * particlesPerLayer;
  const uvLayerSeed = new Float32Array(total * 4);
  const fuzzSize = new Float32Array(total * 2);

  // Deterministic pseudo-random so SSR/hydration & re-renders look balanced
  let rng = 133791;
  const nextRand = () => {
    rng = (rng * 16807) % 2147483647;
    return (rng - 1) / 2147483646;
  };

  const strandsPerLayer = 22;
  let i4 = 0;
  let i2 = 0;

  for (let l = 0; l < layerCount; l++) {
    const layerNorm = layerCount > 1 ? l / (layerCount - 1) : 0.5;
    for (let p = 0; p < particlesPerLayer; p++) {
      const strandIdx = p % strandsPerLayer;
      const strandBaseV = ((strandIdx + 0.5) / strandsPerLayer) * 2 - 1;
      // Tightly aligned near strands with soft scatter for woven silk texture
      const strandScatter = (nextRand() - 0.5) * (2.2 / strandsPerLayer);
      const v = Math.max(-1, Math.min(1, strandBaseV + strandScatter));
      const u = nextRand();
      const seed = nextRand();

      uvLayerSeed[i4++] = u;
      uvLayerSeed[i4++] = v;
      uvLayerSeed[i4++] = layerNorm;
      uvLayerSeed[i4++] = seed;

      fuzzSize[i2++] = (nextRand() - 0.5) * 2;
      fuzzSize[i2++] = 0.45 + Math.pow(nextRand(), 1.6) * 1.15;
    }
  }

  return { total, uvLayerSeed, fuzzSize };
}

export default function GrainMassBackdrop({
  mode = "creator",
  layers = 5,
  opacity = 0.78,
  className = "",
}: GrainMassBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetModeMixRef = useRef<number>(mode === "analyzer" ? 1 : 0);

  useEffect(() => {
    targetModeMixRef.current = mode === "analyzer" ? 1 : 0;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let currentModeMix = targetModeMixRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      pointerTargetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerTargetY = -((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // Try WebGL first for 12,500 silky GPU grain particles; gracefully fall back to Canvas 2D
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });

    if (gl) {
      const program = createProgram(gl);
      if (program) {
        const particlesPerLayer = 2400;
        const { total, uvLayerSeed, fuzzSize } = buildParticleBuffers(layers, particlesPerLayer);

        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvLayerSeed, gl.STATIC_DRAW);

        const fuzzBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fuzzBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fuzzSize, gl.STATIC_DRAW);

        const aUvLayerSeed = gl.getAttribLocation(program, "a_uvLayerSeed");
        const aFuzzSize = gl.getAttribLocation(program, "a_fuzzSize");
        const uTime = gl.getUniformLocation(program, "u_time");
        const uResolution = gl.getUniformLocation(program, "u_resolution");
        const uDpr = gl.getUniformLocation(program, "u_dpr");
        const uPointer = gl.getUniformLocation(program, "u_pointer");
        const uModeMix = gl.getUniformLocation(program, "u_modeMix");
        const uOpacity = gl.getUniformLocation(program, "u_opacity");

        let width = 1;
        let height = 1;
        let dpr = 1;

        const resize = () => {
          const rect = canvas.getBoundingClientRect();
          width = Math.max(1, rect.width);
          height = Math.max(1, rect.height);
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resize();

        const renderFrame = (elapsedSec: number) => {
          pointerX += (pointerTargetX - pointerX) * 0.04;
          pointerY += (pointerTargetY - pointerY) * 0.04;
          currentModeMix += (targetModeMixRef.current - currentModeMix) * 0.05;

          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.ONE, gl.ONE);

          gl.useProgram(program);

          gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
          gl.enableVertexAttribArray(aUvLayerSeed);
          gl.vertexAttribPointer(aUvLayerSeed, 4, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, fuzzBuffer);
          gl.enableVertexAttribArray(aFuzzSize);
          gl.vertexAttribPointer(aFuzzSize, 2, gl.FLOAT, false, 0, 0);

          gl.uniform1f(uTime, elapsedSec);
          gl.uniform2f(uResolution, width, height);
          gl.uniform1f(uDpr, dpr);
          gl.uniform2f(uPointer, pointerX, pointerY);
          gl.uniform1f(uModeMix, currentModeMix);
          gl.uniform1f(uOpacity, opacity);

          gl.drawArrays(gl.POINTS, 0, total);
        };

        let rafId = 0;
        let startTs = performance.now();

        const loop = (now: number) => {
          if (document.hidden || reducedMotionQuery.matches) {
            rafId = 0;
            return;
          }
          renderFrame((now - startTs) * 0.001);
          rafId = window.requestAnimationFrame(loop);
        };

        const startLoop = () => {
          if (reducedMotionQuery.matches) {
            renderFrame(1.4);
            return;
          }
          if (!rafId && !document.hidden) {
            startTs = performance.now() - 1400;
            rafId = window.requestAnimationFrame(loop);
          }
        };

        const resizeObserver = new ResizeObserver(() => {
          resize();
          if (reducedMotionQuery.matches) renderFrame(1.4);
        });
        resizeObserver.observe(canvas);

        const onVisChange = () => {
          if (!document.hidden) startLoop();
        };

        const onMotionChange = () => {
          if (reducedMotionQuery.matches) {
            if (rafId) {
              window.cancelAnimationFrame(rafId);
              rafId = 0;
            }
            renderFrame(1.4);
          } else {
            startLoop();
          }
        };

        document.addEventListener("visibilitychange", onVisChange);
        reducedMotionQuery.addEventListener("change", onMotionChange);
        startLoop();

        return () => {
          if (rafId) window.cancelAnimationFrame(rafId);
          resizeObserver.disconnect();
          window.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("visibilitychange", onVisChange);
          reducedMotionQuery.removeEventListener("change", onMotionChange);
          gl.deleteBuffer(uvBuffer);
          gl.deleteBuffer(fuzzBuffer);
          gl.deleteProgram(program);
        };
      }
    }

    // Canvas 2D Fallback (same layered billowing silk grain math if WebGL is unavailable)
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      window.removeEventListener("pointermove", handlePointerMove);
      return;
    }

    const fallbackData = buildParticleBuffers(layers, 320);
    let width = 1;
    let height = 1;
    let dpr = 1;

    const resize2d = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    resize2d();

    const draw2d = (elapsedSec: number) => {
      pointerX += (pointerTargetX - pointerX) * 0.04;
      pointerY += (pointerTargetY - pointerY) * 0.04;
      currentModeMix += (targetModeMixRef.current - currentModeMix) * 0.05;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const { total, uvLayerSeed, fuzzSize } = fallbackData;
      for (let i = 0; i < total; i++) {
        const u = uvLayerSeed[i * 4];
        const v = uvLayerSeed[i * 4 + 1];
        const layerNorm = uvLayerSeed[i * 4 + 2];
        const seed = uvLayerSeed[i * 4 + 3];
        const fuzz = fuzzSize[i * 2];
        const sizeVal = fuzzSize[i * 2 + 1];

        const layerPhase = layerNorm * 6.2831853 + seed * 0.22;
        const t = elapsedSec * (0.24 + layerNorm * 0.08);
        const fold1 = Math.sin(u * 5.2 - t * 1.15 + layerPhase) * 0.24;
        const billow = Math.sin(u * 3.1 + v * 1.45 - t * 0.92 + layerPhase) * 0.19;
        const twistAngle = u * 3.8 + Math.sin(u * 2.4 - t * 0.65 + layerPhase) * 1.35 + layerNorm * 1.5;
        const ribbonWidth = 0.28 + 0.11 * Math.sin(u * Math.PI + layerPhase);

        const posX = (u - 0.5) * 2.25 + pointerX * 0.05 * (0.5 - layerNorm);
        const posY =
          (layerNorm - 0.5) * 0.62 +
          (u - 0.5) * -0.26 +
          fold1 +
          v * ribbonWidth * Math.cos(twistAngle) +
          billow * (0.45 + 0.55 * Math.abs(v)) +
          fuzz * Math.pow(Math.abs(v), 2.1) * 0.14;

        const sx = (posX * 0.5 + 0.5) * width;
        const sy = (0.5 - posY * 0.5) * height;
        const ridge = 1 - Math.min(1, Math.abs(Math.cos(twistAngle)) / 0.85);
        const uFade = Math.min(1, u / 0.14) * Math.min(1, (1 - u) / 0.14);
        const vFade = Math.max(0, 1 - Math.max(0, Math.abs(v) - 0.62) / 0.43);
        const alpha = (0.14 + ridge * 0.26) * uFade * vFade * opacity;
        if (alpha <= 0.01) continue;

        const r = Math.round(99 + (217 - 99) * currentModeMix + ridge * 40);
        const g = Math.round(102 + (70 - 102) * currentModeMix + ridge * 55);
        const b = Math.round(241 + (239 - 241) * currentModeMix);
        ctx.fillStyle = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, ${alpha})`;
        const rad = 0.8 + sizeVal * 1.05;
        ctx.fillRect(sx, sy, rad, rad);
      }

      ctx.globalCompositeOperation = "source-over";
    };

    let rafId = 0;
    const startTs = performance.now();

    const loop2d = (now: number) => {
      if (document.hidden || reducedMotionQuery.matches) {
        rafId = 0;
        return;
      }
      draw2d((now - startTs) * 0.001);
      rafId = window.requestAnimationFrame(loop2d);
    };

    const start2d = () => {
      if (reducedMotionQuery.matches) {
        draw2d(1.4);
        return;
      }
      if (!rafId && !document.hidden) {
        rafId = window.requestAnimationFrame(loop2d);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize2d();
      if (reducedMotionQuery.matches) draw2d(1.4);
    });
    resizeObserver.observe(canvas);
    start2d();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [layers, opacity]);

  return (
    <div
      aria-hidden="true"
      className={`no-print pointer-events-none fixed inset-0 md:left-64 z-0 overflow-hidden ${className}`}
    >
      {/* Soft atmospheric depth base matching the active CV tab */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background:
            mode === "analyzer"
              ? "radial-gradient(58% 48% at 74% 20%, rgba(217, 70, 239, 0.12) 0%, transparent 72%), radial-gradient(52% 46% at 22% 76%, rgba(99, 102, 241, 0.1) 0%, transparent 72%)"
              : "radial-gradient(58% 48% at 72% 18%, rgba(99, 102, 241, 0.13) 0%, transparent 72%), radial-gradient(52% 46% at 24% 78%, rgba(139, 92, 246, 0.1) 0%, transparent 72%)",
        }}
      />

      {/* Layered silk particle canvas with feathered edges */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{
          WebkitMaskImage:
            "radial-gradient(92% 88% at 50% 48%, #000 58%, transparent 100%)",
          maskImage:
            "radial-gradient(92% 88% at 50% 48%, #000 58%, transparent 100%)",
        }}
      />
    </div>
  );
}
