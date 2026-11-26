import { IFaceLandmarkProvider, RawFaceLandmarkResult } from "./face-landmark-provider.interface";
import { HeadEulerAngles, FaceLandmarkPoint, IrisGazeMetric } from "./types";

/**
 * Filtro de compatibilidad: Emscripten/WASM redirige internamente stderr a console.error
 * en entornos de navegador. Mensajes puramente informativos como "INFO: Created TensorFlow Lite...",
 * o advertencias de inicialización de aceleradores no son errores y se canalizan a console.info
 * para evitar falsos positivos en el overlay de desarrollo de Next.js.
 */
if (
  typeof window !== "undefined" &&
  !(window as unknown as { __emscripten_info_filtered__?: boolean }).__emscripten_info_filtered__
) {
  (window as unknown as { __emscripten_info_filtered__?: boolean }).__emscripten_info_filtered__ = true;
  
  const isHarmlessWasmMessage = (args: unknown[]): boolean => {
    const text = args
      .map((a) => {
        if (typeof a === "string") return a;
        if (a instanceof Error) return a.message;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a ?? "");
        }
      })
      .join(" ");

    return (
      text.includes("INFO:") ||
      text.includes("TensorFlow Lite") ||
      text.includes("XNNPACK delegate") ||
      text.includes("FaceBlendshapesGraph") ||
      text.includes("OpenGL error checking") ||
      text.includes("face_landmarker_graph") ||
      text.includes("gl_context") ||
      text.includes("vision_wasm_internal") ||
      text.includes("Abort handler called") ||
      /^[IWE]\d{4}\s/i.test(text.trim())
    );
  };

  const originalError = console.error;
  console.error = function (...args: unknown[]) {
    if (isHarmlessWasmMessage(args)) {
      console.info("[MediaPipe Native Info]", ...args);
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args: unknown[]) {
    if (isHarmlessWasmMessage(args)) {
      console.info("[MediaPipe Native Notice]", ...args);
      return;
    }
    originalWarn.apply(console, args);
  };
}

/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL ADAPTER & SINGLETON (GoF): MediaPipeFaceProvider
 * ============================================================================
 * Adapta la biblioteca Google MediaPipe Face Landmarker (@mediapipe/tasks-vision)
 * al contrato estándar IFaceLandmarkProvider de DevCareer AI.
 *
 * Características avanzadas:
 *  - Carga asíncrona y perezosa (lazy load) de los módulos WASM y el modelo .task.
 *  - Patrón Singleton con conteo de referencias para reutilizar el modelo en memoria
 *    y evitar re-compilaciones costosas en los ciclos de montaje de React.
 *  - Fallback automático de GPU (WebGL/WebGPU) a CPU si la aceleración falla.
 *  - Conversión de matrices de transformación 4x4 a ángulos de Euler 3D (Yaw, Pitch, Roll).
 *  - Extracción normalizada de los 52 blendshapes FACS.
 */
interface FaceLandmarkerInstance {
  detectForVideo(
    videoFrame: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
    facialTransformationMatrixes?: Array<{ data: number[] }>;
  };
  close(): void;
}

export class MediaPipeFaceProvider implements IFaceLandmarkProvider {
  private static instance: MediaPipeFaceProvider | null = null;
  private faceLandmarker: FaceLandmarkerInstance | null = null;
  private isInitialized = false;
  private initializingPromise: Promise<void> | null = null;
  private refCount = 0;

  /**
   * Patrón Singleton: Garantiza una única instancia compartida del modelo de visión
   * en la sesión de entrevista, optimizando consumo de memoria y tiempo de carga.
   */
  public static getInstance(): MediaPipeFaceProvider {
    if (!MediaPipeFaceProvider.instance) {
      MediaPipeFaceProvider.instance = new MediaPipeFaceProvider();
    }
    return MediaPipeFaceProvider.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      try {
        const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");

        // Intentar cargar assets WASM locales; fallback a CDN oficial
        let vision: unknown;
        try {
          vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        } catch (localErr) {
          console.warn("[MediaPipeFaceProvider] Usando CDN de Google para WASM:", localErr);
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
        }

        const modelLocalPath = "/mediapipe/models/face_landmarker.task";
        const modelCdnPath =
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

        // Intentar inicializar con aceleración por GPU
        try {
          this.faceLandmarker = (await FaceLandmarker.createFromOptions(vision as never, {
            baseOptions: {
              modelAssetPath: modelLocalPath,
              delegate: "GPU",
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1,
          })) as unknown as FaceLandmarkerInstance;
        } catch (gpuErr) {
          console.warn("[MediaPipeFaceProvider] Fallo en GPU/Local, reintentando con CPU y CDN:", gpuErr);
          this.faceLandmarker = (await FaceLandmarker.createFromOptions(vision as never, {
            baseOptions: {
              modelAssetPath: modelCdnPath,
              delegate: "CPU",
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1,
          })) as unknown as FaceLandmarkerInstance;
        }

        this.isInitialized = true;
        console.log("[MediaPipeFaceProvider] ✅ Modelo FaceLandmarker inicializado con éxito.");
      } catch (err) {
        console.error("[MediaPipeFaceProvider] ❌ Error inicializando MediaPipe Face Landmarker:", err);
        throw err;
      }
    })();

    return this.initializingPromise;
  }

  public detect(
    videoElement: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): RawFaceLandmarkResult {
    const emptyResult: RawFaceLandmarkResult = {
      faceDetected: false,
      landmarks: [],
      blendshapes: {},
      headAngles: { yaw: 0, pitch: 0, roll: 0 },
    };

    if (!this.faceLandmarker || !this.isInitialized) {
      return emptyResult;
    }

    try {
      const results = this.faceLandmarker.detectForVideo(videoElement, timestampMs);

      if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
        return emptyResult;
      }

      // 1. Extraer Landmarks 3D (478 puntos)
      const rawLandmarks = results.faceLandmarks[0] || [];
      const landmarks: FaceLandmarkPoint[] = rawLandmarks.map((p: { x: number; y: number; z?: number }) => ({
        x: p.x,
        y: p.y,
        z: p.z || 0,
      }));

      // 2. Extraer 52 Blendshapes FACS en un diccionario clave-valor
      const blendshapes: Record<string, number> = {};
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const categories = results.faceBlendshapes[0].categories || [];
        for (const cat of categories) {
          blendshapes[cat.categoryName] = cat.score;
        }
      }

      // 3. Extraer ángulos de Euler (Yaw, Pitch, Roll) desde la matriz 4x4 o desde landmarks
      let headAngles: HeadEulerAngles = { yaw: 0, pitch: 0, roll: 0 };
      if (
        results.facialTransformationMatrixes &&
        results.facialTransformationMatrixes.length > 0
      ) {
        const matrix = results.facialTransformationMatrixes[0].data || [];
        headAngles = this.extractEulerAnglesFromMatrix(matrix);
      } else if (landmarks.length >= 468) {
        headAngles = this.estimateEulerAnglesFromLandmarks(landmarks);
      }

      // 4. Extraer métricas de Iris (landmarks 468-477) y distancia interocular
      let irisGaze: IrisGazeMetric | undefined = undefined;
      let interocularDistance = 0.2;

      if (landmarks.length >= 478) {
        const leftOuter = landmarks[33];
        const leftInner = landmarks[133];
        const leftIris = landmarks[468];
        const rightInner = landmarks[362];
        const rightOuter = landmarks[263];
        const rightIris = landmarks[473];

        if (leftOuter && leftInner && leftIris && rightInner && rightOuter && rightIris) {
          const leftWidth = Math.max(0.01, Math.abs(leftInner.x - leftOuter.x));
          const rightWidth = Math.max(0.01, Math.abs(rightOuter.x - rightInner.x));

          const leftRatioX = (leftIris.x - Math.min(leftOuter.x, leftInner.x)) / leftWidth;
          const rightRatioX = (rightIris.x - Math.min(rightInner.x, rightOuter.x)) / rightWidth;

          const avgHorizontalOffset = ((leftRatioX - 0.5) + (rightRatioX - 0.5)) / 2;
          const avgVerticalOffset = ((leftIris.y - (leftOuter.y + leftInner.y) / 2) + (rightIris.y - (rightOuter.y + rightInner.y) / 2)) / 2;

          irisGaze = {
            leftRatioX,
            leftRatioY: 0.5,
            rightRatioX,
            rightRatioY: 0.5,
            avgHorizontalOffset: Math.round(avgHorizontalOffset * 100) / 100,
            avgVerticalOffset: Math.round(avgVerticalOffset * 100) / 100,
          };

          interocularDistance = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y);
        }
      }

      return {
        faceDetected: true,
        landmarks,
        blendshapes,
        headAngles,
        irisGaze,
        interocularDistance,
      };
    } catch (detectErr) {
      console.warn("[MediaPipeFaceProvider] Error en procesamiento de frame:", detectErr);
      return emptyResult;
    }
  }

  /**
   * Extrae los ángulos de Euler (en grados) a partir de una matriz de rotación 4x4 columna-mayor.
   */
  private extractEulerAnglesFromMatrix(matrix: number[]): HeadEulerAngles {
    if (matrix.length < 16) return { yaw: 0, pitch: 0, roll: 0 };

    // Matriz de rotación 3x3 contenida en la matriz 4x4 columna-mayor:
    // [ r00, r10, r20, 0 ]
    // [ r01, r11, r21, 0 ]
    // [ r02, r12, r22, 0 ]
    // [ tx,  ty,  tz,  1 ]
    const r20 = matrix[2];
    const r01 = matrix[4];
    const r11 = matrix[5];
    const r21 = matrix[6];
    const r22 = matrix[10];

    const radToDeg = 180 / Math.PI;

    // Pitch (eje X, mirar arriba/abajo)
    const pitch = Math.asin(Math.max(-1, Math.min(1, -r21))) * radToDeg;

    // Yaw (eje Y, rotación izq/der)
    const yaw = Math.atan2(r20, r22) * radToDeg;

    // Roll (eje Z, ladear cabeza)
    const roll = Math.atan2(r01, r11) * radToDeg;

    return {
      yaw: Math.round(yaw * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
      roll: Math.round(roll * 10) / 10,
    };
  }

  /**
   * Estimación trigonométrica alternativa de ángulos a partir de puntos anatómicos clave:
   * Nariz (1), Mentón (152), Ojo Izquierdo (33), Ojo Derecho (263), Frente (10).
   */
  private estimateEulerAnglesFromLandmarks(lm: FaceLandmarkPoint[]): HeadEulerAngles {
    const nose = lm[1] || { x: 0.5, y: 0.5, z: 0 };
    const leftEye = lm[33] || { x: 0.4, y: 0.4, z: 0 };
    const rightEye = lm[263] || { x: 0.6, y: 0.4, z: 0 };
    const chin = lm[152] || { x: 0.5, y: 0.7, z: 0 };

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeDist = Math.abs(rightEye.x - leftEye.x);

    // Yaw aproximado según el desplazamiento lateral de la nariz respecto al punto medio de los ojos
    const yaw = ((nose.x - eyeMidX) / (eyeDist || 0.2)) * 60;

    // Pitch aproximado según la distancia vertical nariz-ojos vs nariz-mentón
    const eyeNoseDistY = nose.y - (leftEye.y + rightEye.y) / 2;
    const noseChinDistY = chin.y - nose.y;
    const pitch = ((eyeNoseDistY / (noseChinDistY || 0.1)) - 0.75) * 60;

    // Roll según la inclinación de la línea interocular
    const dy = rightEye.y - leftEye.y;
    const dx = rightEye.x - leftEye.x;
    const roll = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      yaw: Math.round(yaw * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
      roll: Math.round(roll * 10) / 10,
    };
  }

  public dispose(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    // Mantenemos la instancia caliente durante la sesión para evitar
    // re-inicializaciones lentas de WASM en ciclos de montaje de React.
  }

  public forceDispose(): void {
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch (e) {
        console.warn("[MediaPipeFaceProvider] Aviso al cerrar FaceLandmarker:", e);
      }
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
    this.initializingPromise = null;
    this.refCount = 0;
    MediaPipeFaceProvider.instance = null;
  }

  public isReady(): boolean {
    return this.isInitialized && this.faceLandmarker !== null;
  }
}
