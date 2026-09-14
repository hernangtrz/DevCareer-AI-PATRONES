import { IAIProvider } from "./ai-provider.interface";
import { AIProviderFactory } from "./ai-provider.factory";

export interface CodeEvaluationResult {
  score: number;
  complexity: {
    time: string;
    space: string;
  };
  patternAnalysis: {
    isPatternApplied: boolean;
    patternName: string;
    solidAdherence: string;
  };
  codeSmellsEliminated: string[];
  strengths: string[];
  improvements: string[];
  interviewerTip: string;
}

export interface EvaluateCodeChallengeParams {
  code: string;
  problemTitle: string;
  problemDescription: string;
  passedCount: number;
  totalCount: number;
  isDesignPattern?: boolean;
}

/**
 * Servicio especializado en evaluación técnica de retos de código (SRP).
 * Analiza corrección algorítmica, complejidad Big-O, antipatrones y aplicación de patrones SOLID.
 */
export class CodeChallengeService {
  constructor(private aiProvider: IAIProvider = AIProviderFactory.getProvider()) {}

  async evaluate(params: EvaluateCodeChallengeParams): Promise<CodeEvaluationResult> {
    const patternInstructions = params.isDesignPattern
      ? `ESPECIALIZACIÓN EN PATRONES DE DISEÑO Y CÓDIGO LIMPIO:
El candidato está resolviendo un reto de REFACTORIZACIÓN Y PATRONES DE DISEÑO.
Evalúa rigurosamente:
1. ¿Implementó correctamente el Patrón de Diseño esperado (Strategy, Factory, Observer, Adapter, etc.) desacoplando la lógica?
2. ¿Cumple con los principios SOLID (especialmente Single Responsibility y Open/Closed)?
3. ¿Eliminó los malos olores de código (Code Smells como switch/case anidados, acoplamiento directo, duplicidad)?`
      : `ESPECIALIZACIÓN EN ALGORITMOS Y ESTRUCTURAS DE DATOS:
Evalúa rigurosamente la corrección lógica, eficiencia temporal/espacial Big-O y casos límite.`;

    const prompt = `Eres un Staff Software Engineer y experto en Arquitectura de Software, Patrones de Diseño GoF y principios SOLID evaluando la solución de código de un candidato técnico.

PROBLEMA: ${params.problemTitle}
DESCRIPCIÓN DEL RETO:
${params.problemDescription}

CÓDIGO ENVIADO POR EL CANDIDATO (JavaScript/TypeScript):
\`\`\`javascript
${params.code}
\`\`\`

RESULTADOS DE PRUEBAS UNITARIAS: ${params.passedCount}/${params.totalCount} tests pasados.

${patternInstructions}

INSTRUCCIONES DE EVALUACIÓN:
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "score": <número entero de 0 a 100>,
  "complexity": {
    "time": "<ej: O(1), O(n), O(log n)>",
    "space": "<ej: O(1), O(n)>"
  },
  "patternAnalysis": {
    "isPatternApplied": <true si aplicó un patrón GoF o estructura limpia, false si dejó código acoplado>,
    "patternName": "<nombre del patrón detectado o 'N/A'>",
    "solidAdherence": "<comentario conciso sobre si respeta Single Responsibility y Open/Closed Principle>"
  },
  "codeSmellsEliminated": [
    "<string con mal olor eliminado 1>",
    "<string con mal olor eliminado 2>"
  ],
  "strengths": [
    "<fortaleza técnica 1>",
    "<fortaleza técnica 2>"
  ],
  "improvements": [
    "<mejora concreta 1>",
    "<mejora concreta 2>"
  ],
  "interviewerTip": "<consejo conciso de 1-2 oraciones que un entrevistador senior daría al candidato>"
}

REGLAS DE PUNTUACIÓN:
- Si los tests fallan o hay errores de sintaxis: Score < 45.
- Si los tests pasan pero el código tiene malos olores o no aplicó el patrón: Score entre 55 y 74.
- Si los tests pasan, aplica el patrón correctamente y respeta SOLID: Score entre 85 y 100.`;

    return this.aiProvider.generateJson<CodeEvaluationResult>(
      [{ text: prompt }],
      { temperature: 0.3 }
    );
  }
}
