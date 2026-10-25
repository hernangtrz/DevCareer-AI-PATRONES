import {
  InterviewEvaluationService,
  EnglishProficiencyService,
  CvAnalysisService,
  CodeChallengeService,
  InterviewFeedbackResult,
  EnglishProficiencyFeedback,
  CvAtsAnalysisResult,
  CodeEvaluationResult,
  AnalyzeCvAtsParams,
  EvaluateCodeChallengeParams,
} from "../../services/ai";
import {
  CvOptimizationService,
  ImproveCvInput,
  ImprovedCvResult,
  ImproveProfileInput,
  ImprovedProfileResult,
} from "../../services/cv-optimization.service";
import { IAIProvider } from "../../services/ai/ai-provider.interface";
import { AIProviderFactory } from "../../services/ai/ai-provider.factory";

/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): AIServiceFacade
 * ============================================================================
 * Proporciona una interfaz unificada, tipada y de alto nivel hacia el subsistema
 * heterogéneo de Inteligencia Artificial de DevCareer AI:
 *  - Evaluación de Entrevistas Técnicas (InterviewEvaluationService)
 *  - Evaluación Lingüística CEFR en Inglés (EnglishProficiencyService)
 *  - Diagnóstico ATS Multimodal de Currículums (CvAnalysisService)
 *  - Evaluación Algorítmica y Complejidad Big-O (CodeChallengeService)
 *  - Optimización Semántica de Hojas de Vida (CvOptimizationService)
 *
 * Correcciones de Seguridad y Arquitectura:
 * 1. Elimina la puerta trasera `callGeminiRaw` que permitía inyecciones arbitrarias de prompts.
 * 2. Desacopla a los clientes del proveedor comercial concreto (DIP / OCP).
 * 3. Permite inyección de dependencias para testing y previene bypasses directos a clases internas.
 */
export class AIServiceFacade {
  private interviewEvaluationService: InterviewEvaluationService;
  private englishProficiencyService: EnglishProficiencyService;
  private cvAnalysisService: CvAnalysisService;
  private codeChallengeService: CodeChallengeService;
  private cvOptimizationService: CvOptimizationService;

  constructor(aiProvider?: IAIProvider) {
    const provider = aiProvider || AIProviderFactory.getProvider();
    this.interviewEvaluationService = new InterviewEvaluationService(provider);
    this.englishProficiencyService = new EnglishProficiencyService(provider);
    this.cvAnalysisService = new CvAnalysisService(provider);
    this.codeChallengeService = new CodeChallengeService(provider);
    this.cvOptimizationService = new CvOptimizationService(provider);
  }

  /**
   * Evalúa multidimensionalmente el desempeño técnico y blando en una entrevista de voz.
   */
  public async evaluateInterview(
    formattedTranscript: string,
    isEnglish: boolean
  ): Promise<InterviewFeedbackResult> {
    return this.interviewEvaluationService.evaluate(formattedTranscript, isEnglish);
  }

  /**
   * Evalúa la competencia lingüística bajo el estándar europeo CEFR (A1-C2).
   */
  public async evaluateEnglishProficiency(
    formattedTranscript: string
  ): Promise<EnglishProficiencyFeedback> {
    return this.englishProficiencyService.evaluate(formattedTranscript);
  }

  /**
   * Analiza compatibilidad ATS entre un CV (PDF en Base64 o Texto) y una oferta laboral.
   */
  public async analyzeCvAts(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult> {
    return this.cvAnalysisService.analyze(params);
  }

  /**
   * Evalúa una solución de código en cuanto a corrección, complejidad Big-O y principios SOLID.
   */
  public async evaluateCodeChallenge(
    params: EvaluateCodeChallengeParams
  ): Promise<CodeEvaluationResult> {
    return this.codeChallengeService.evaluate(params);
  }

  /**
   * Optimiza el contenido completo de una hoja de vida (titulares, perfil y viñetas de logros).
   */
  public async optimizeCv(input: ImproveCvInput): Promise<ImprovedCvResult> {
    return this.cvOptimizationService.improveCv(input);
  }

  /**
   * Optimiza el resumen ejecutivo del perfil profesional para aumentar impacto.
   */
  public async optimizeProfile(input: ImproveProfileInput): Promise<ImprovedProfileResult> {
    return this.cvOptimizationService.improveProfile(input);
  }
}

