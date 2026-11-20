import { FaceLandmarkPoint, HeadEulerAngles } from "./types";

/**
 * Resultado crudo extraído de un frame de video por el proveedor de visión.
 */
export interface RawFaceLandmarkResult {
  faceDetected: boolean;
  landmarks: FaceLandmarkPoint[];
  blendshapes: Record<string, number>;
  headAngles: HeadEulerAngles;
  facialTransformationMatrix?: number[];
}

/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL ADAPTER (GoF): IFaceLandmarkProvider
 * ============================================================================
 * Define el contrato estándar para proveedores de inferencia facial.
 * Desacopla la aplicación de bibliotecas concretas como MediaPipe, TensorFlow.js
 * o simuladores de pruebas unitarias.
 */
export interface IFaceLandmarkProvider {
  /**
   * Inicializa el modelo y los recursos WASM/GPU del proveedor.
   */
  initialize(): Promise<void>;

  /**
   * Procesa un elemento de video o canvas y extrae landmarks + blendshapes.
   */
  detect(videoElement: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): RawFaceLandmarkResult;

  /**
   * Libera la memoria y los contextos WebGL/WASM.
   */
  dispose(): void;

  /**
   * Indica si el proveedor está listo para procesar frames.
   */
  isReady(): boolean;
}
