/**
 * ============================================================================
 * FILTROS DE SEÑAL Y CINEMÁTICA CONDUCTUAL (DevCareer AI)
 * ============================================================================
 * Implementa el filtro One-Euro (Casiez et al., ACM CHI 2012) para eliminar
 * el temblor (jitter) de alta frecuencia en reposo sin retraso (lag) perceptible
 * en movimientos rápidos de cabeza, gestos y blendshapes FACS.
 */

export interface OneEuroFilterConfig {
  minCutoff?: number; // Frecuencia de corte mínima en Hz (menor = más suave en reposo)
  beta?: number;      // Coeficiente de velocidad (mayor = menos lag en movimientos rápidos)
  dCutoff?: number;   // Frecuencia de corte para el cálculo de la derivada
}

class LowPassFilter {
  private y = 0;
  private s = 0;
  private initialized = false;

  public filter(val: number, alpha: number): number {
    if (!this.initialized) {
      this.s = val;
      this.initialized = true;
      return val;
    }
    this.s = alpha * val + (1 - alpha) * this.s;
    return this.s;
  }

  public last(): number {
    return this.s;
  }

  public reset(): void {
    this.initialized = false;
    this.s = 0;
    this.y = 0;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime = 0;

  constructor(config: OneEuroFilterConfig = {}) {
    this.minCutoff = config.minCutoff ?? 1.2;
    this.beta = config.beta ?? 0.025;
    this.dCutoff = config.dCutoff ?? 1.0;
  }

  private computeAlpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  public filter(val: number, timestampMs: number): number {
    if (this.lastTime === 0 || timestampMs <= this.lastTime) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(val, 1.0);
    }

    const dt = Math.max(0.001, (timestampMs - this.lastTime) / 1000);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // 1. Filtrar la derivada de velocidad
    const dx = (val - this.xFilter.last()) * rate;
    const edx = this.dxFilter.filter(dx, this.computeAlpha(rate, this.dCutoff));

    // 2. Frecuencia de corte adaptativa según la velocidad
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // 3. Filtrar el valor primario
    return this.xFilter.filter(val, this.computeAlpha(rate, cutoff));
  }

  public reset(): void {
    this.lastTime = 0;
    this.xFilter.reset();
    this.dxFilter.reset();
  }
}

/**
 * Filtro One-Euro para vectores 3D (ej. ángulos de Euler: yaw, pitch, roll)
 */
export class Vector3OneEuroFilter {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;

  constructor(config: OneEuroFilterConfig = {}) {
    this.filterX = new OneEuroFilter(config);
    this.filterY = new OneEuroFilter(config);
    this.filterZ = new OneEuroFilter(config);
  }

  public filter(x: number, y: number, z: number, timestampMs: number): { x: number; y: number; z: number } {
    return {
      x: this.filterX.filter(x, timestampMs),
      y: this.filterY.filter(y, timestampMs),
      z: this.filterZ.filter(z, timestampMs),
    };
  }

  public reset(): void {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}

/**
 * Calcula la mediana robusta de un arreglo de números (inmune a parpadeos o picos fugaces)
 */
export function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Diferencia angular mínima considerando la periodicidad modular (-180° a +180°)
 */
export function angleDelta(angle: number, baseline: number): number {
  let diff = (angle - baseline) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}
