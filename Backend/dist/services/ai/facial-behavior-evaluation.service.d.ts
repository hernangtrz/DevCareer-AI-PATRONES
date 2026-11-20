import { IAIProvider } from "./ai-provider.interface";
import { FacialTelemetrySummary, FacialBehaviorFeedback } from "../../types";
export interface EvaluateFacialBehaviorParams {
    facialMetrics: FacialTelemetrySummary;
    role?: string;
    isEnglish?: boolean;
}
/**
 * ============================================================================
 * SERVICIO ESPECIALIZADO: FacialBehaviorEvaluationService (SRP)
 * ============================================================================
 * Interpreta la telemetría facial y cinemática (FACS, 52 blendshapes, orientación 3D)
 * para transformarla en retroalimentación empática, accionable y profesional.
 */
export declare class FacialBehaviorEvaluationService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    evaluate(params: EvaluateFacialBehaviorParams): Promise<FacialBehaviorFeedback>;
    private buildPrompt;
    private buildInsufficientDataFeedback;
    private buildDeterministicFallback;
}
