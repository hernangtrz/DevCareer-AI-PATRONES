"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvOptimizationService = void 0;
const ai_provider_factory_1 = require("./ai/ai-provider.factory");
/**
 * Servicio especializado en optimización y redacción de currículums (CC-06).
 * Aplica el patrón Service Layer (SRP / DIP), aislando las reglas de negocio,
 * formateo de prompts y estructuración del CV del controlador HTTP.
 */
class CvOptimizationService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    /**
     * Optimiza las secciones completas del CV (headline, perfil, bullets de experiencia y skills).
     */
    async improveCv(input) {
        const langName = input.language === "en" ? "English (Inglés)" : "Spanish (Español)";
        const translateNote = input.translate
            ? `IMPORTANTE: El usuario ha cambiado el idioma del CV a ${langName}. Debes TRADUCIR TODO el contenido al ${langName}, incluyendo los bullets de experiencia, habilidades, perfil, títulos de cargo y educación.`
            : `El idioma de salida de todo el contenido debe ser: ${langName}.`;
        const prompt = `Actúa como un reclutador experto y escritor profesional de CVs optimizados para filtros ATS.
Tu objetivo es optimizar los datos de la hoja de vida que te proporciono para el rol objetivo: "${input.targetRole || "Profesional TI"}".

${translateNote}

Aquí están los datos actuales del candidato:
- Título profesional actual: "${input.personalInfo?.headline || ""}"
- Perfil Profesional (Acerca de mí): "${input.profileText || ""}"
- Experiencia laboral actual: ${JSON.stringify(input.experiences || [])}
- Habilidades técnicas actuales: ${JSON.stringify(input.skills || [])}
- Educación: ${JSON.stringify(input.education || [])}

Realiza las siguientes mejoras (en el idioma solicitado):
1. **Título profesional (headline)**: Reescríbelo para que sea de alto impacto y contenga palabras clave para el rol "${input.targetRole}".
2. **Perfil profesional**: Si está presente, mejora la redacción y tradúcelo al idioma solicitado.
3. **Experiencia laboral (bullets)**: Reescribe los puntos usando verbos de acción fuertes. Si el usuario pidió traducción, tradúcelos también.
4. **Habilidades técnicas (skills)**: Normaliza los nombres (ej. "reactjs" -> "React"). Si pidió traducción, traduce habilidades no técnicas (ej. "Trabajo en equipo" -> "Teamwork").
5. **Mantener consistencia**: No alteres los nombres de las empresas ni las fechas.

Devuelve ÚNICAMENTE un objeto JSON estructurado exactamente así:
{
  "personalInfo": {
    "headline": "Título profesional optimizado en el idioma solicitado"
  },
  "profileText": "Perfil profesional mejorado y traducido (vacío si no había texto original)",
  "experiences": [
    {
      "company": "Mismo nombre de empresa sin alterar",
      "role": "Cargo traducido si aplica",
      "startDate": "Misma fecha de inicio",
      "endDate": "Misma fecha de fin",
      "bullets": [
        "Logro/Responsabilidad optimizada 1 con verbo de acción fuerte",
        "Logro/Responsabilidad optimizada 2 con verbo de acción fuerte"
      ]
    }
  ],
  "skills": [
    "Habilidad 1 estandarizada",
    "Habilidad 2 estandarizada"
  ]
}`;
        return this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.4 });
    }
    /**
     * Perfecciona el resumen profesional / perfil ejecutivo del candidato.
     */
    async improveProfile(input) {
        const prompt = `Actúa como un reclutador experto y redactor profesional de CVs.
Tu tarea es perfeccionar el "Perfil Profesional" (también llamado "Acerca de mí" o "Resumen Ejecutivo") de un candidato para que sea atractivo, profesional, use un tono formal y esté alineado con el rol objetivo: "${input.targetRole || "Profesional TI"}".

El idioma de salida del párrafo resultante debe ser: ${input.language === "en" ? "Inglés (English)" : "Español (Spanish)"}.

Aquí está el texto de perfil actual provisto por el usuario:
"${input.profileText || ""}"

Instrucciones:
1. Mejora la gramática, redacción, vocabulario y fluidez profesional.
2. Hazlo sonar motivador, dinámico y con palabras clave que encajen con el rol objetivo "${input.targetRole}".
3. Debe ser un único párrafo conciso (entre 3 y 5 oraciones, máximo 120 palabras).
4. No agregues certificaciones o estudios específicos que no se mencionen en el texto original, mantén la fidelidad a los hechos reales.

Devuelve ÚNICAMENTE un objeto JSON estructurado exactamente así:
{
  "refinedProfile": "Párrafo de perfil profesional mejorado en el idioma solicitado"
}`;
        return this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.5 });
    }
}
exports.CvOptimizationService = CvOptimizationService;
//# sourceMappingURL=cv-optimization.service.js.map