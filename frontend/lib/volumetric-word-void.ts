/**
 * Native WebGL2 volumetric pointer-lit typography renderer.
 *
 * Implements:
 * - Fullscreen triangle derived from gl_VertexID (no VBOs), opaque output,
 *   antialias: false, premultipliedAlpha: false, DPR capped at 1.25.
 * - 3-channel word mask (R: sharp silhouette, G: blur h*0.006, B: blur h*0.03)
 *   with UNPACK_FLIP_Y_WEBGL=true during upload and restored to false.
 * - Local deterministic 64x64 toroidal blue-noise texture (NEAREST, REPEAT).
 * - 36 ray-march steps x 5 vertical light taps (bar 0.28, density 26.0,
 *   weights 1 - abs(ft) * 1.2, falloff exp(-r*1.8) / (1 + r*r*24)).
 * - Tone mapping col / (1 + col * 0.8), gamma 1/2.2, vignette, grain 0.028.
 * - Entrance reveal min(elapsed/1.6, 1)^2, damped pointer/touch tracking
 *   1 - exp(-3.2*dt) (clamped dt <= 0.05s), 4s hold -> 6s blend into idle drift.
 * - prefers-reduced-motion: immediate reveal, damping 30, idle drift disabled.
 */

export interface StartVoidOptions {
  /** Element whose bounding rect receives pointer/touch events and drives sizing. Defaults to canvas.parentElement ?? canvas. */
  interactionTarget?: HTMLElement | null;
  /** CSS font family override. Defaults to computed fontFamily of canvas/body (Mona Sans). */
  fontFamily?: string;
  /** Font weight for mask generation. Defaults to 600. */
  fontWeight?: number | string;
}

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 pos = vec2(
    float((gl_VertexID & 1) << 2) - 1.0,
    float((gl_VertexID & 2) << 1) - 1.0
  );
  vUv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uMask;
uniform sampler2D uNoise;
uniform vec2 uRes;
uniform float uAspect;
uniform vec2 uLight;
uniform float uTime;
uniform float uReveal;

const int MARCH_STEPS = 36;
const int LIGHT_TAPS = 5;
const float LIGHT_BAR = 0.28;
const float DENSITY = 26.0;
const float GRAIN_AMP = 0.028;

vec2 lightSpaceToUv(vec2 pt) {
  return vec2(pt.x / uAspect + 0.5, pt.y + 0.5);
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

  // 64x64 tiled blue-noise sample with golden-ratio temporal offset
  vec2 noiseUv = (gl_FragCoord.xy + vec2(fract(uTime * 1.6180339) * 64.0, fract(uTime * 0.7548776) * 64.0)) / 64.0;
  vec4 bn = textureLod(uNoise, noiseUv, 0.0);

  vec4 mask = textureLod(uMask, uv, 0.0);
  float sharp = mask.r;
  float bevel = mask.g;
  float halo = mask.b;

  // Volumetric ray-marching across 5 vertical light taps x 36 steps
  vec3 volLight = vec3(0.0);
  float totalWeight = 0.0;

  for (int ti = 0; ti < LIGHT_TAPS; ti++) {
    float ft = (float(ti) / float(LIGHT_TAPS - 1)) - 0.5; // -0.5 .. 0.5
    float tapWeight = max(1.0 - abs(ft) * 1.2, 0.0);
    totalWeight += tapWeight;

    vec2 tapLight = uLight + vec2(0.0, ft * LIGHT_BAR);
    vec2 toLight = tapLight - p;
    float dist = length(toLight);
    float r = max(dist - 0.03, 0.0);
    float falloff = exp(-r * 1.8) / (1.0 + r * r * 24.0);

    float jitter = fract(bn.r + float(ti) * 0.38196601);
    float thickness = 0.0;
    float stepLen = dist / float(MARCH_STEPS);

    for (int s = 0; s < MARCH_STEPS; s++) {
      float t = (float(s) + jitter) / float(MARCH_STEPS);
      vec2 sp = p + toLight * t;
      vec2 suv = lightSpaceToUv(sp);
      if (suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0) {
        thickness += textureLod(uMask, suv, 0.0).g * stepLen;
      }
    }

    float transmittance = exp(-thickness * DENSITY);

    // DevCareer brand palette: luminous lavender-white -> indigo/violet -> subtle fuchsia accent
    vec3 baseViolet = mix(
      vec3(0.92, 0.90, 1.00),
      vec3(0.54, 0.36, 0.98),
      clamp(r * 1.45, 0.0, 1.0)
    );
    vec3 brandPalette = mix(
      baseViolet,
      vec3(0.86, 0.38, 0.84),
      smoothstep(0.28, 0.95, r) * 0.42
    );

    volLight += brandPalette * falloff * transmittance * tapWeight;
  }

  volLight /= max(totalWeight, 0.0001);

  // Mask-gradient edge facing for dimensional beveled letter rims
  vec2 texel = (1.0 / max(uRes, vec2(1.0))) * 2.2;
  float gx = textureLod(uMask, uv + vec2(texel.x, 0.0), 0.0).g - textureLod(uMask, uv - vec2(texel.x, 0.0), 0.0).g;
  float gy = textureLod(uMask, uv + vec2(0.0, texel.y), 0.0).g - textureLod(uMask, uv - vec2(0.0, texel.y), 0.0).g;
  vec2 grad = vec2(gx, gy);
  float gradMag = length(grad);
  vec2 normal2d = gradMag > 0.0005 ? (grad / gradMag) : vec2(0.0);

  vec2 mainToLight = uLight - p;
  float mainDist = length(mainToLight);
  vec2 lightDir = mainDist > 0.0001 ? (mainToLight / mainDist) : vec2(0.0, 1.0);
  float mainR = max(mainDist - 0.03, 0.0);
  float mainFalloff = exp(-mainR * 1.8) / (1.0 + mainR * mainR * 24.0);

  // Facing rim catches crisp lavender-violet light along letter bevels
  float rimFacing = clamp(dot(-normal2d, lightDir), 0.0, 1.0);
  float edgeMask = smoothstep(0.02, 0.35, gradMag) * (1.0 - sharp * 0.65);
  vec3 edgeColor = mix(vec3(0.95, 0.93, 1.00), vec3(0.72, 0.48, 0.99), clamp(mainR * 1.3, 0.0, 1.0));
  vec3 edgeHighlight = edgeColor * rimFacing * edgeMask * (0.45 + mainFalloff * 2.8);

  // Blue-channel soft halo catching indigo/fuchsia scatter around glyphs
  vec3 haloColor = mix(vec3(0.66, 0.56, 1.00), vec3(0.80, 0.30, 0.84), clamp(mainR * 1.5, 0.0, 1.0));
  vec3 haloScatter = haloColor * halo * (0.08 + mainFalloff * 0.85) * (1.0 - sharp);

  // Bright local light core
  float coreGlow = exp(-mainR * 6.5) / (1.0 + mainR * mainR * 80.0);
  vec3 localLight = vec3(0.93, 0.91, 1.00) * coreGlow * 0.55;

  // Near-black base canvas harmonized with DevCareer's dark hero surface
  vec3 bgBase = vec3(0.006, 0.006, 0.011);
  vec3 col = bgBase + volLight * 2.35 + haloScatter + localLight;

  // Solid dark slab silhouette with subtle depth shading & rim bleed
  vec3 slabBase = vec3(0.010, 0.010, 0.016);
  float slabDepth = clamp(bevel * 0.65 + (1.0 - halo) * 0.35, 0.0, 1.0);
  vec3 slabColor = slabBase + edgeColor * (0.04 + rimFacing * 0.26) * mainFalloff * (1.0 - slabDepth * 0.55);
  col = mix(col, slabColor, sharp);
  col += edgeHighlight;

  // Entrance reveal curve
  col *= clamp(uReveal, 0.0, 1.0);

  // Tone mapping: col / (1 + col * 0.8)
  col = col / (1.0 + col * 0.8);

  // Gamma correction: 1 / 2.2
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

  // Subtle vignette
  vec2 vigUv = uv * 2.0 - 1.0;
  float vig = 1.0 - dot(vigUv * vec2(0.55, 0.62), vigUv * vec2(0.55, 0.62)) * 0.38;
  col *= clamp(vig, 0.45, 1.0);

  // Animated blue-noise grain (amplitude 0.028)
  col += (bn.g - 0.5) * GRAIN_AMP;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

let cachedBlueNoise64: Uint8Array | null = null;

/**
 * Generates a deterministic 64x64 RGBA toroidal blue-noise texture locally
 * (interleaved gradient + high-frequency toroidal blue-noise shaping, zero external fetches).
 */
function getBlueNoise64Data(): Uint8Array {
  if (cachedBlueNoise64) return cachedBlueNoise64;

  const size = 64;
  const count = size * size;
  const field = new Float32Array(count);

  // Seed with interleaved gradient noise + low-discrepancy R2 sequence
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const ign = ((52.9829189 * (((0.06711056 * x + 0.00583715 * y) % 1 + 1) % 1)) % 1 + 1) % 1;
      const r2 = ((0.7548776662 * x + 0.5698402909 * y) % 1 + 1) % 1;
      field[idx] = (ign * 0.6 + r2 * 0.4) % 1;
    }
  }

  // Two toroidal high-pass relaxation passes push energy away from low frequencies
  const highPass = new Float32Array(count);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < size; y++) {
      const ym = (y + size - 1) & 63;
      const yp = (y + 1) & 63;
      for (let x = 0; x < size; x++) {
        const xm = (x + size - 1) & 63;
        const xp = (x + 1) & 63;
        const c = field[y * size + x];
        const avg =
          (field[ym * size + xm] +
            field[ym * size + x] * 2 +
            field[ym * size + xp] +
            field[y * size + xm] * 2 +
            field[y * size + xp] * 2 +
            field[yp * size + xm] +
            field[yp * size + x] * 2 +
            field[yp * size + xp]) /
          12;
        highPass[y * size + x] = c - avg;
      }
    }
    // Rank-equalize back to uniform [0, 1] so histogram stays flat while spectrum stays blue
    const indices = new Uint16Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
    indices.sort((a, b) => highPass[a] - highPass[b]);
    for (let rank = 0; rank < count; rank++) {
      field[indices[rank]] = (rank + 0.5) / count;
    }
  }

  const rgba = new Uint8Array(count * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const rVal = field[i];
      const gVal = field[((y + 23) & 63) * size + ((x + 37) & 63)];
      const bVal = field[((y + 41) & 63) * size + ((x + 13) & 63)];
      rgba[i * 4] = Math.min(255, Math.max(0, Math.floor(rVal * 256)));
      rgba[i * 4 + 1] = Math.min(255, Math.max(0, Math.floor(gVal * 256)));
      rgba[i * 4 + 2] = Math.min(255, Math.max(0, Math.floor(bVal * 256)));
      rgba[i * 4 + 3] = 255;
    }
  }

  cachedBlueNoise64 = rgba;
  return rgba;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[VolumetricVoid] Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
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
    console.warn("[VolumetricVoid] Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Generates the 3-channel mask canvas:
 * R = sharp silhouette, G = blur(h * 0.006), B = blur(h * 0.03)
 * using black clear + additive ('lighter') compositing.
 */
function buildWordMaskCanvas(
  maskCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  word: string,
  fontFamily: string,
  fontWeight: number | string
): void {
  maskCanvas.width = width;
  maskCanvas.height = height;
  const ctx = maskCanvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  let fontSize = Math.min(height * 0.42, width * 0.34);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Keep letterSpacing = -fontSize * 0.02 when supported by the browser
  const ctxWithSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in ctxWithSpacing) {
    ctxWithSpacing.letterSpacing = `${(-fontSize * 0.02).toFixed(2)}px`;
  }

  // Fit wider words (e.g. "DEVCAREER") cleanly inside viewport without clipping
  const measured = ctx.measureText(word).width;
  const maxAllowedWidth = width * 0.88;
  if (measured > maxAllowedWidth && measured > 0) {
    fontSize = fontSize * (maxAllowedWidth / measured);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    if ("letterSpacing" in ctxWithSpacing) {
      ctxWithSpacing.letterSpacing = `${(-fontSize * 0.02).toFixed(2)}px`;
    }
  }

  const cx = width * 0.5;
  const cy = height * 0.5 + fontSize * 0.04;

  ctx.globalCompositeOperation = "lighter";

  // Red channel: sharp text silhouette
  ctx.filter = "none";
  ctx.fillStyle = "#ff0000";
  ctx.fillText(word, cx, cy);

  // Green channel: medium blur (height * 0.006)
  const gBlur = Math.max(1, height * 0.006);
  ctx.filter = `blur(${gBlur.toFixed(2)}px)`;
  ctx.fillStyle = "#00ff00";
  ctx.fillText(word, cx, cy);

  // Blue channel: wide halo blur (height * 0.03)
  const bBlur = Math.max(2, height * 0.03);
  ctx.filter = `blur(${bBlur.toFixed(2)}px)`;
  ctx.fillStyle = "#0000ff";
  ctx.fillText(word, cx, cy);

  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Starts the WebGL2 volumetric typography lighting renderer on `canvas`.
 * Returns a cleanup callback that cancels RAF, detaches listeners/observers,
 * and disposes all WebGL2 resources — or `null` if WebGL2 initialization fails.
 */
export function startVoid(
  canvas: HTMLCanvasElement,
  word: string,
  options: StartVoidOptions = {}
): (() => void) | null {
  const gl =
    canvas.getContext("webgl2", {
      antialias: false,
      premultipliedAlpha: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    }) ?? canvas.getContext("webgl2");
  if (!gl) {
    console.warn("[VolumetricVoid] WebGL2 context unavailable; switching to Canvas 2D fallback.");
    return null;
  }

  const program = createProgram(gl);
  if (!program) return null;

  const vao = gl.createVertexArray();
  const maskTexture = gl.createTexture();
  const noiseTexture = gl.createTexture();
  if (!vao || !maskTexture || !noiseTexture) {
    if (vao) gl.deleteVertexArray(vao);
    if (maskTexture) gl.deleteTexture(maskTexture);
    if (noiseTexture) gl.deleteTexture(noiseTexture);
    gl.deleteProgram(program);
    return null;
  }

  // Upload 64x64 blue-noise texture (NEAREST, REPEAT, FLIP_Y = false)
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    64,
    64,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    getBlueNoise64Data()
  );

  // Configure word mask texture (LINEAR, CLAMP_TO_EDGE)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uMaskLoc = gl.getUniformLocation(program, "uMask");
  const uNoiseLoc = gl.getUniformLocation(program, "uNoise");
  const uResLoc = gl.getUniformLocation(program, "uRes");
  const uAspectLoc = gl.getUniformLocation(program, "uAspect");
  const uLightLoc = gl.getUniformLocation(program, "uLight");
  const uTimeLoc = gl.getUniformLocation(program, "uTime");
  const uRevealLoc = gl.getUniformLocation(program, "uReveal");

  gl.useProgram(program);
  gl.uniform1i(uMaskLoc, 0);
  gl.uniform1i(uNoiseLoc, 1);

  const targetEl = options.interactionTarget ?? canvas.parentElement ?? canvas;
  const fontWeight = options.fontWeight ?? 600;
  const maskCanvas = document.createElement("canvas");

  let disposed = false;
  let width = 1;
  let height = 1;
  let aspect = 1;
  let isVisible = true;
  let rafId = 0;

  // Light and target initialized at (0.06, 0.16) in aspect-corrected centered coordinates
  let lightX = 0.06;
  let lightY = 0.16;
  let targetX = 0.06;
  let targetY = 0.16;
  let startTimeMs = 0;
  let lastFrameMs = 0;
  let lastInputElapsed = -10;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;

  const resolveFontFamily = (): string => {
    if (options.fontFamily) return options.fontFamily;
    const computed = window.getComputedStyle(targetEl).fontFamily || window.getComputedStyle(document.body).fontFamily;
    return computed || '"Mona Sans", system-ui, sans-serif';
  };

  const uploadMask = () => {
    if (disposed || width <= 0 || height <= 0) return;
    buildWordMaskCanvas(maskCanvas, width, height, word, resolveFontFamily(), fontWeight);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  };

  const syncSize = () => {
    if (disposed) return;
    const rect = targetEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const nextW = Math.max(1, Math.round(rect.width * dpr));
    const nextH = Math.max(1, Math.round(rect.height * dpr));
    if (nextW === width && nextH === height) return;
    width = nextW;
    height = nextH;
    aspect = width / height;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform2f(uResLoc, width, height);
    gl.uniform1f(uAspectLoc, aspect);
    uploadMask();
  };

  const updateTargetFromClient = (clientX: number, clientY: number) => {
    const rect = targetEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    targetX = (nx - 0.5) * aspect;
    targetY = 0.5 - ny;
    if (startTimeMs > 0) {
      lastInputElapsed = (performance.now() - startTimeMs) / 1000;
    } else {
      lastInputElapsed = 0;
    }
  };

  const onPointerMove = (ev: PointerEvent) => {
    updateTargetFromClient(ev.clientX, ev.clientY);
  };

  const onPointerDown = (ev: PointerEvent) => {
    updateTargetFromClient(ev.clientX, ev.clientY);
  };

  const onTouchMove = (ev: TouchEvent) => {
    if (ev.touches.length > 0) {
      const touch = ev.touches[0];
      updateTargetFromClient(touch.clientX, touch.clientY);
    }
  };

  const onReducedMotionChange = (ev: MediaQueryListEvent) => {
    reducedMotion = ev.matches;
  };

  const render = (now: number) => {
    if (disposed) return;
    rafId = 0;

    if (!isVisible || document.hidden) return;

    if (startTimeMs === 0) {
      startTimeMs = now;
      lastFrameMs = now;
    }

    const elapsed = (now - startTimeMs) / 1000;
    const dt = Math.min(Math.max((now - lastFrameMs) / 1000, 0), 0.05);
    lastFrameMs = now;

    // Reveal: immediate for reduced-motion, min(elapsed / 1.6, 1)^2 otherwise
    const revealLinear = Math.min(elapsed / 1.6, 1);
    const reveal = reducedMotion ? 1.0 : revealLinear * revealLinear;

    let desiredX = targetX;
    let desiredY = targetY;

    if (!reducedMotion) {
      const sinceInput = elapsed - lastInputElapsed;
      if (sinceInput > 4.0) {
        const blend = Math.min((sinceInput - 4.0) / 6.0, 1.0);
        desiredX += Math.sin(elapsed * 0.23) * Math.max(0.24, aspect * 0.16) * blend;
        desiredY += Math.sin(elapsed * 0.17 + 1.3) * 0.14 * blend;
      }
    }

    const damping = reducedMotion ? 30.0 : 3.2;
    const alpha = 1.0 - Math.exp(-damping * dt);
    lightX += (desiredX - lightX) * alpha;
    lightY += (desiredY - lightY) * alpha;

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.uniform2f(uResLoc, width, height);
    gl.uniform1f(uAspectLoc, aspect);
    gl.uniform2f(uLightLoc, lightX, lightY);
    gl.uniform1f(uTimeLoc, elapsed);
    gl.uniform1f(uRevealLoc, reveal);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = window.requestAnimationFrame(render);
  };

  const ensureRunning = () => {
    if (disposed || !isVisible || document.hidden || rafId !== 0) return;
    lastFrameMs = performance.now();
    rafId = window.requestAnimationFrame(render);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      ensureRunning();
    }
  };

  // Initial sizing & mask build after local font is ready
  syncSize();
  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    document.fonts.ready.then(() => {
      if (!disposed) {
        uploadMask();
        ensureRunning();
      }
    });
  }

  let resizeRaf = 0;
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (disposed || resizeRaf !== 0) return;
          resizeRaf = window.requestAnimationFrame(() => {
            resizeRaf = 0;
            syncSize();
          });
        })
      : null;
  resizeObserver?.observe(targetEl);

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            isVisible = entry ? entry.isIntersecting : true;
            if (isVisible) {
              ensureRunning();
            } else if (rafId !== 0) {
              window.cancelAnimationFrame(rafId);
              rafId = 0;
            }
          },
          { threshold: 0.01 }
        )
      : null;
  intersectionObserver?.observe(targetEl);

  targetEl.addEventListener("pointermove", onPointerMove);
  targetEl.addEventListener("pointerdown", onPointerDown);
  targetEl.addEventListener("touchmove", onTouchMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);
  window.addEventListener("resize", syncSize);

  ensureRunning();

  return () => {
    disposed = true;
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (resizeRaf !== 0) {
      window.cancelAnimationFrame(resizeRaf);
      resizeRaf = 0;
    }
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    targetEl.removeEventListener("pointermove", onPointerMove);
    targetEl.removeEventListener("pointerdown", onPointerDown);
    targetEl.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
    window.removeEventListener("resize", syncSize);

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
    gl.deleteVertexArray(vao);
    gl.deleteTexture(maskTexture);
    gl.deleteTexture(noiseTexture);
    gl.deleteProgram(program);
  };
}

/**
 * Interactive Canvas 2D volumetric typography lighting fallback.
 * Runs smoothly whenever WebGL2 is disabled, blocklisted, or loses context,
 * preserving pointer/touch tracking, idle drift, warm god-rays, and beveled rims.
 */
export function startVoidCanvas2D(
  canvas: HTMLCanvasElement,
  word: string,
  options: StartVoidOptions = {}
): (() => void) | null {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  const targetEl = options.interactionTarget ?? canvas.parentElement ?? canvas;
  const fontWeight = options.fontWeight ?? 600;

  const wordCanvas = document.createElement("canvas");
  const rimGlowCanvas = document.createElement("canvas");
  const rimCanvas = document.createElement("canvas");
  const rayCanvas = document.createElement("canvas");
  const rayScratch = document.createElement("canvas");

  let disposed = false;
  let width = 1;
  let height = 1;
  let rayW = 1;
  let rayH = 1;
  let aspect = 1;
  let isVisible = true;
  let rafId = 0;

  let lightX = 0.06;
  let lightY = 0.16;
  let targetX = 0.06;
  let targetY = 0.16;
  let startTimeMs = 0;
  let lastFrameMs = 0;
  let lastInputElapsed = -10;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;

  const resolveFontFamily = (): string => {
    if (options.fontFamily) return options.fontFamily;
    const computed =
      window.getComputedStyle(targetEl).fontFamily ||
      window.getComputedStyle(document.body).fontFamily;
    return computed || '"Mona Sans", system-ui, sans-serif';
  };

  const rebuildWordLayers = () => {
    if (disposed || width <= 0 || height <= 0) return;

    wordCanvas.width = width;
    wordCanvas.height = height;
    rimGlowCanvas.width = width;
    rimGlowCanvas.height = height;
    rimCanvas.width = width;
    rimCanvas.height = height;

    const wCtx = wordCanvas.getContext("2d");
    const gCtx = rimGlowCanvas.getContext("2d");
    const rCtx = rimCanvas.getContext("2d");
    if (!wCtx || !gCtx || !rCtx) return;

    const fontFamily = resolveFontFamily();
    let fontSize = Math.min(height * 0.44, width * 0.34);

    const configureFont = (c: CanvasRenderingContext2D) => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      const spaced = c as CanvasRenderingContext2D & { letterSpacing?: string };
      if ("letterSpacing" in spaced) {
        spaced.letterSpacing = `${(-fontSize * 0.02).toFixed(2)}px`;
      }
    };

    configureFont(wCtx);
    const measured = wCtx.measureText(word).width;
    const maxAllowedWidth = width * 0.88;
    if (measured > maxAllowedWidth && measured > 0) {
      fontSize = fontSize * (maxAllowedWidth / measured);
      configureFont(wCtx);
    }

    const cx = width * 0.5;
    const cy = height * 0.5 + fontSize * 0.04;

    wCtx.clearRect(0, 0, width, height);
    wCtx.fillStyle = "#ffffff";
    wCtx.fillText(word, cx, cy);

    // Pre-blurred DevCareer lavender-violet rim layer (built once per resize so per-frame draw avoids ctx.filter)
    configureFont(gCtx);
    gCtx.clearRect(0, 0, width, height);
    gCtx.filter = `blur(${Math.max(1.2, height * 0.005).toFixed(1)}px)`;
    gCtx.fillStyle = "#c4b5fd";
    gCtx.fillText(word, cx, cy);
    gCtx.filter = "none";

    configureFont(rCtx);
    rCtx.clearRect(0, 0, width, height);
    rCtx.fillStyle = "#08080e";
    rCtx.fillText(word, cx, cy);
  };

  const syncSize = () => {
    if (disposed) return;
    const rect = targetEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const nextW = Math.max(1, Math.round(rect.width * dpr));
    const nextH = Math.max(1, Math.round(rect.height * dpr));
    if (nextW === width && nextH === height) return;

    width = nextW;
    height = nextH;
    aspect = width / height;
    canvas.width = width;
    canvas.height = height;

    rayW = Math.max(64, Math.round(width / 3));
    rayH = Math.max(32, Math.round(height / 3));
    rayCanvas.width = rayW;
    rayCanvas.height = rayH;
    rayScratch.width = rayW;
    rayScratch.height = rayH;

    rebuildWordLayers();
  };

  const updateTargetFromClient = (clientX: number, clientY: number) => {
    const rect = targetEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    targetX = (nx - 0.5) * aspect;
    targetY = 0.5 - ny;
    lastInputElapsed =
      startTimeMs > 0 ? (performance.now() - startTimeMs) / 1000 : 0;
  };

  const onPointerMove = (ev: PointerEvent) => updateTargetFromClient(ev.clientX, ev.clientY);
  const onPointerDown = (ev: PointerEvent) => updateTargetFromClient(ev.clientX, ev.clientY);
  const onTouchMove = (ev: TouchEvent) => {
    if (ev.touches.length > 0) {
      updateTargetFromClient(ev.touches[0].clientX, ev.touches[0].clientY);
    }
  };
  const onReducedMotionChange = (ev: MediaQueryListEvent) => {
    reducedMotion = ev.matches;
  };

  const render = (now: number) => {
    if (disposed) return;
    rafId = 0;
    if (!isVisible || document.hidden) return;

    if (startTimeMs === 0) {
      startTimeMs = now;
      lastFrameMs = now;
    }

    const elapsed = (now - startTimeMs) / 1000;
    const dt = Math.min(Math.max((now - lastFrameMs) / 1000, 0), 0.05);
    lastFrameMs = now;

    const revealLinear = Math.min(elapsed / 1.6, 1);
    const reveal = reducedMotion ? 1.0 : revealLinear * revealLinear;

    let desiredX = targetX;
    let desiredY = targetY;

    if (!reducedMotion) {
      const sinceInput = elapsed - lastInputElapsed;
      if (sinceInput > 4.0) {
        const blend = Math.min((sinceInput - 4.0) / 6.0, 1.0);
        desiredX += Math.sin(elapsed * 0.23) * Math.max(0.24, aspect * 0.16) * blend;
        desiredY += Math.sin(elapsed * 0.17 + 1.3) * 0.14 * blend;
      }
    }

    const damping = reducedMotion ? 30.0 : 3.2;
    const alpha = 1.0 - Math.exp(-damping * dt);
    lightX += (desiredX - lightX) * alpha;
    lightY += (desiredY - lightY) * alpha;

    const lx = (lightX / aspect + 0.5) * width;
    const ly = (0.5 - lightY) * height;
    const rlx = (lightX / aspect + 0.5) * rayW;
    const rly = (0.5 - lightY) * rayH;

    // 1. Build occluded light field on low-res rayCanvas
    const rCtx = rayCanvas.getContext("2d");
    const sCtx = rayScratch.getContext("2d");
    if (rCtx && sCtx) {
      rCtx.globalCompositeOperation = "source-over";
      rCtx.clearRect(0, 0, rayW, rayH);

      const radius = Math.max(rayW, rayH) * 0.72;
      const grad = rCtx.createRadialGradient(rlx, rly, 0, rlx, rly, radius);
      grad.addColorStop(0.0, "rgba(236, 232, 255, 0.96)");
      grad.addColorStop(0.18, "rgba(154, 132, 255, 0.72)");
      grad.addColorStop(0.44, "rgba(139, 92, 246, 0.32)");
      grad.addColorStop(0.75, "rgba(217, 70, 239, 0.11)");
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      rCtx.fillStyle = grad;
      rCtx.fillRect(0, 0, rayW, rayH);

      // Punch out word mask so letters cast sharp volumetric shadows
      rCtx.globalCompositeOperation = "destination-out";
      rCtx.drawImage(wordCanvas, 0, 0, rayW, rayH);

      // Radial god-ray passes expanding away from the light origin
      sCtx.globalCompositeOperation = "source-over";
      sCtx.clearRect(0, 0, rayW, rayH);
      sCtx.drawImage(rayCanvas, 0, 0);

      rCtx.globalCompositeOperation = "lighter";
      const passes = 12;
      for (let i = 1; i <= passes; i++) {
        const scale = 1 + i * 0.032;
        const passAlpha = 0.14 * (1 - i / (passes + 2));
        rCtx.save();
        rCtx.globalAlpha = passAlpha;
        rCtx.translate(rlx, rly);
        rCtx.scale(scale, scale);
        rCtx.translate(-rlx, -rly);
        rCtx.drawImage(rayScratch, 0, 0);
        rCtx.restore();
      }
      rCtx.globalAlpha = 1;
      rCtx.globalCompositeOperation = "source-over";
    }

    // 2. Composite final scene onto main canvas
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#030306";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rayCanvas, 0, 0, width, height);

    // Soft DevCareer indigo-violet atmospheric halo around letters near the light
    const haloRadius = Math.max(width, height) * 0.42;
    const haloGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, haloRadius);
    haloGrad.addColorStop(0.0, "rgba(232, 226, 255, 0.34)");
    haloGrad.addColorStop(0.3, "rgba(167, 139, 250, 0.16)");
    haloGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, width, height);

    // Light-facing warm rim highlight along beveled edges of DEVCAREER
    const dirX = lx - width * 0.5;
    const dirY = ly - height * 0.5;
    const dirLen = Math.hypot(dirX, dirY) || 1;
    const rimOffsetX = (dirX / dirLen) * Math.max(1.5, height * 0.0045);
    const rimOffsetY = (dirY / dirLen) * Math.max(1.5, height * 0.0045);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = reveal * 0.65;
    ctx.drawImage(rimGlowCanvas, rimOffsetX, rimOffsetY);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = reveal;
    ctx.drawImage(rimCanvas, 0, 0);

    // Subtle vignette harmonizing with the dark hero card edges
    const vigRadius = Math.hypot(width * 0.5, height * 0.5);
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      vigRadius * 0.45,
      width * 0.5,
      height * 0.5,
      vigRadius
    );
    vig.addColorStop(0, "rgba(0, 0, 0, 0)");
    vig.addColorStop(1, "rgba(1, 1, 3, 0.52)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    rafId = window.requestAnimationFrame(render);
  };

  const ensureRunning = () => {
    if (disposed || !isVisible || document.hidden || rafId !== 0) return;
    lastFrameMs = performance.now();
    rafId = window.requestAnimationFrame(render);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      ensureRunning();
    }
  };

  syncSize();
  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    document.fonts.ready.then(() => {
      if (!disposed) {
        rebuildWordLayers();
        ensureRunning();
      }
    });
  }

  let resizeRaf = 0;
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (disposed || resizeRaf !== 0) return;
          resizeRaf = window.requestAnimationFrame(() => {
            resizeRaf = 0;
            syncSize();
          });
        })
      : null;
  resizeObserver?.observe(targetEl);

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            isVisible = entry ? entry.isIntersecting : true;
            if (isVisible) {
              ensureRunning();
            } else if (rafId !== 0) {
              window.cancelAnimationFrame(rafId);
              rafId = 0;
            }
          },
          { threshold: 0.01 }
        )
      : null;
  intersectionObserver?.observe(targetEl);

  targetEl.addEventListener("pointermove", onPointerMove);
  targetEl.addEventListener("pointerdown", onPointerDown);
  targetEl.addEventListener("touchmove", onTouchMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);
  window.addEventListener("resize", syncSize);

  ensureRunning();

  return () => {
    disposed = true;
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (resizeRaf !== 0) {
      window.cancelAnimationFrame(resizeRaf);
      resizeRaf = 0;
    }
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    targetEl.removeEventListener("pointermove", onPointerMove);
    targetEl.removeEventListener("pointerdown", onPointerDown);
    targetEl.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
    window.removeEventListener("resize", syncSize);
  };
}
