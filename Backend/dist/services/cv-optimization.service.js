"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvOptimizationService = void 0;
const ai_provider_factory_1 = require("./ai/ai-provider.factory");
function normalizeTemplateId(raw) {
    switch ((raw || "").toLowerCase().trim()) {
        case "ejecutivo":
            return "ejecutivo";
        case "moderno":
        case "creativo":
            return "moderno";
        case "ats":
            return "ats";
        case "profesional":
        default:
            return "profesional";
    }
}
/**
 * Elimina Markdown, viñetas duplicadas y símbolos incompatibles con parsers ATS.
 */
function sanitizePlainText(text, strictAts) {
    let cleaned = (text || "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\r?\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    if (strictAts) {
        // Remover emojis, pictogramas y caracteres decorativos que rompen parsers ATS
        cleaned = cleaned
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
            .replace(/[•▪▸►◆★☆✓✔✦✧→←]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    }
    return cleaned;
}
function sanitizeBullet(text, strictAts) {
    const base = sanitizePlainText(text, strictAts);
    // Quitar cualquier cadena de prefijos de viñeta para evitar "- - Texto" o "• • Texto"
    return base.replace(/^(?:[-–—•*▸►·]\s*)+/, "").trim();
}
function getTemplatePromptDirectives(templateId) {
    switch (templateId) {
        case "ats":
            return {
                label: "ATS-Optimizado (máxima compatibilidad con filtros automáticos)",
                instructions: `ESTILO DE PLANTILLA SELECCIONADA: **ATS-Optimizado (ESTRICTO)**
Reglas OBLIGATORIAS para superar parsers ATS (Workday, Greenhouse, Lever, Taleo):
- **Headline**: Usa un título estándar de industria alineado al rol objetivo, seguido opcionalmente de 2 a 3 tecnologías/especialidades núcleo separadas por " | " (ej. "Senior React Developer | TypeScript, Next.js & Frontend Architecture"). CERO emojis, CERO frases publicitarias vagas ("Rockstar", "Ninja", "Apasionado").
- **Resumen Profesional (profileText)**: Redacta 3 a 4 oraciones directas (60-95 palabras máx.) en tercera persona implícita, ricas en palabras clave reales del rol objetivo y del stack provisto. Si "profileText" venía vacío, CRÉALO usando únicamente los hechos reales presentes en experiencias, habilidades, educación y rol objetivo (NO inventes empresas, títulos ni certificaciones).
- **Bullets de experiencia**: Usa estructura de impacto ATS (**Verbo de acción fuerte + Tecnología/Acción concreta + Resultado/alcance verificable**). NO inventes cifras o porcentajes falsos si el candidato no los proporcionó; si ya existen métricas, destácalas con claridad. Devuelve cada bullet como texto plano limpio SIN guiones, SIN viñetas al inicio, SIN markdown (**negritas**) y SIN emojis.
- **Habilidades técnicas (skills)**: Estandariza cada habilidad a su nombre canónico exacto que buscan los ATS (ej. "reactjs" -> "React", "js" -> "JavaScript", "ts" -> "TypeScript", "nodejs" -> "Node.js", "postgres" -> "PostgreSQL"), elimina duplicados y ordénalas de mayor a menor relevancia para el rol objetivo. No inventes tecnologías no mencionadas ni implícitas, pero puedes desdoblar/estandarizar las existentes con precisión.
- **Educación**: Corrige ortografía y capitalización del título (y tradúcelo si cambió el idioma) conservando intacta la institución y el año.`,
                appliedRules: [
                    "Keywords canónicas alineadas al rol objetivo",
                    "Texto plano 100% libre de emojis, markdown y viñetas duplicadas",
                    "Bullets orientados a verbos de acción e impacto verificable",
                    "Resumen profesional optimizado para lectura por parsers ATS",
                ],
            };
        case "ejecutivo":
            return {
                label: "Ejecutivo (liderazgo estratégico e impacto de negocio)",
                instructions: `ESTILO DE PLANTILLA SELECCIONADA: **Ejecutivo**
- **Headline**: Enfoque de liderazgo, arquitectura o responsabilidad estratégica alineado al rol objetivo.
- **Resumen Ejecutivo (profileText)**: Tono formal y autoritativo (3-4 oraciones), destacando visión técnica/estratégica, entrega de valor al negocio y colaboración interfuncional. Si estaba vacío, redáctalo únicamente con base en los datos reales del candidato.
- **Bullets de experiencia**: Prioriza verbos de liderazgo y propiedad (ej. "Lideró", "Diseñó la arquitectura", "Impulsó", "Consolidó" / "Spearheaded", "Architected", "Drove"), resaltando impacto organizacional sin inventar métricas falsas. Sin prefijos de viñeta ni markdown.
- **Habilidades**: Estandariza y agrupa implícitamente las competencias de mayor nivel primero.`,
                appliedRules: [
                    "Tono ejecutivo con foco en liderazgo e impacto de negocio",
                    "Resumen estratégico conciso y autoritativo",
                    "Bullets orientados a propiedad y resultados",
                ],
            };
        case "moderno":
            return {
                label: "Moderno con Sidebar (diseño de 2 columnas escaneable)",
                instructions: `ESTILO DE PLANTILLA SELECCIONADA: **Moderno con Sidebar**
- **Headline**: Conciso y moderno (máx. 8-10 palabras) para encajar limpio en el encabezado de la barra lateral.
- **Perfil (Sobre mí / profileText)**: Dinámico, claro y actual (2-4 oraciones, máx. 80 palabras). Si estaba vacío, créalo con base en los datos reales del candidato.
- **Bullets de experiencia**: Ágiles, concretos y fáciles de escanear (1-2 líneas por punto, verbos de acción fuertes, sin guiones/viñetas iniciales ni markdown).
- **Habilidades (skills)**: Etiquetas cortas y limpias (1 a 3 palabras por habilidad, ej. "React", "TypeScript", "REST APIs") para que se visualicen perfectamente en la barra lateral de 36% sin desbordarse.`,
                appliedRules: [
                    "Redacción ágil y escaneable para layout de 2 columnas",
                    "Etiquetas de habilidades compactas para la barra lateral",
                    "Headline breve optimizado para encabezado vertical",
                ],
            };
        case "profesional":
        default:
            return {
                label: "Profesional Clásico (corporativo estructurado)",
                instructions: `ESTILO DE PLANTILLA SELECCIONADA: **Profesional Clásico**
- **Headline**: Claro, formal y orientado a solidez técnica/profesional para el rol objetivo.
- **Perfil Profesional (profileText)**: Redacción formal, fluida y equilibrada (3-4 oraciones). Si estaba vacío, créalo usando únicamente los hechos reales presentes en los datos del candidato.
- **Bullets de experiencia**: Verbos de acción precisos, responsabilidades bien estructuradas y logros claros sin inventar métricas falsas. Sin prefijos de viñeta ni markdown.
- **Habilidades**: Nombres estandarizados y capitalización profesional consistente.`,
                appliedRules: [
                    "Registro corporativo formal y estructurado",
                    "Bullets claros con verbos de acción fuertes",
                    "Estandarización profesional de habilidades y educación",
                ],
            };
    }
}
/**
 * Servicio especializado en optimización y redacción de currículums (CC-06).
 * Aplica los principios SOLID (SRP / DIP), aislando las reglas de negocio,
 * formateo de prompts por plantilla y sanitización estricta ATS del controlador HTTP.
 */
class CvOptimizationService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    /**
     * Optimiza las secciones completas del CV adaptándose a la plantilla seleccionada
     * (profesional, ejecutivo, moderno o ats) y garantizando higiene de salida.
     */
    async improveCv(input) {
        const templateId = normalizeTemplateId(input.templateId);
        const strictAts = templateId === "ats";
        const isEnglish = input.language === "en";
        const langName = isEnglish ? "English (Inglés)" : "Spanish (Español)";
        const strategy = getTemplatePromptDirectives(templateId);
        const rawExperiences = Array.isArray(input.experiences) ? input.experiences : [];
        const meaningfulExperiences = rawExperiences.filter((exp) => Boolean(exp?.company?.trim()) ||
            Boolean(exp?.role?.trim()) ||
            (Array.isArray(exp?.bullets) && exp.bullets.some((b) => Boolean(b?.trim()))));
        const rawEducation = Array.isArray(input.education) ? input.education : [];
        const meaningfulEducation = rawEducation.filter((edu) => Boolean(edu?.institution?.trim()) || Boolean(edu?.degree?.trim()));
        const rawSkills = Array.isArray(input.skills)
            ? input.skills.map((s) => String(s || "").trim()).filter(Boolean)
            : [];
        const translateNote = input.translate
            ? `IMPORTANTE: El usuario ha cambiado el idioma del CV a ${langName}. Debes TRADUCIR TODO el contenido al ${langName}: headline, perfil profesional, cargos, bullets de experiencia, títulos académicos en educación y habilidades no técnicas. Traduce también "Presente" <-> "Present" en las fechas si aparece.`
            : `El idioma de salida de TODO el contenido debe ser estrictamente: ${langName}.`;
        const prompt = `Actúa como un reclutador técnico senior y redactor experto en CVs optimizados para filtros ATS y selección tecnológica.
Tu objetivo es potenciar los datos reales de la hoja de vida para el rol objetivo: "${input.targetRole || "Profesional TI"}".

${strategy.instructions}

${translateNote}

DATOS ACTUALES DEL CANDIDATO:
- Título profesional actual (headline): "${input.personalInfo?.headline || ""}"
- Perfil Profesional actual (profileText): "${input.profileText || ""}"
- Experiencia laboral real (${meaningfulExperiences.length} registros): ${JSON.stringify(meaningfulExperiences)}
- Educación real (${meaningfulEducation.length} registros): ${JSON.stringify(meaningfulEducation)}
- Habilidades técnicas actuales: ${JSON.stringify(rawSkills)}

REGLAS DE CONSISTENCIA E INTEGRIDAD (CRÍTICAS):
1. NO alteres los nombres de las empresas ("company") ni las instituciones educativas ("institution"), ni inventes años o fechas.
2. Si "Experiencia laboral real" tiene 0 registros, devuelve "experiences": []. NO inventes empleos ficticios.
3. Si "Educación real" tiene 0 registros, devuelve "education": []. NO inventes títulos ni universidades.
4. Conserva el mismo número y orden de experiencias (${meaningfulExperiences.length}) y de registros de educación (${meaningfulEducation.length}).
5. Si una experiencia tiene pocos bullets o descripciones muy breves, mejóralos y conviértelos en 2-4 logros concretos basados fielmente en ese rol y stack (sin inventar cifras o tecnologías ajenas).
6. NO incluyas guiones ("- "), asteriscos ("* "), viñetas ("• ") ni formato Markdown ("**texto**") dentro de los strings del JSON.
7. Si "profileText" está vacío pero existen datos de rol objetivo, experiencia, educación o habilidades, redacta un resumen profesional sólido y veraz en ${langName}.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "personalInfo": {
    "headline": "Título profesional optimizado en ${langName}"
  },
  "profileText": "Resumen profesional optimizado en ${langName}",
  "experiences": [
    {
      "company": "Mismo nombre exacto de empresa",
      "role": "Cargo optimizado y en ${langName}",
      "startDate": "Misma fecha de inicio (traducida si aplica, ej. Jan 2022 / Ene 2022)",
      "endDate": "Misma fecha de fin (traducida si aplica, ej. Present / Presente, o vacío si venía vacío)",
      "bullets": [
        "Logro optimizado 1 sin guion ni viñeta inicial",
        "Logro optimizado 2 sin guion ni viñeta inicial"
      ]
    }
  ],
  "education": [
    {
      "institution": "Mismo nombre exacto de institución",
      "degree": "Título académico corregido y en ${langName}",
      "year": "Mismo año"
    }
  ],
  "skills": [
    "Habilidad estandarizada 1",
    "Habilidad estandarizada 2"
  ]
}`;
        const aiResponse = await this.aiProvider.generateJson([{ text: prompt }], { temperature: strictAts ? 0.25 : 0.4 });
        // Sanitización y preservación determinística de integridad
        const safeHeadline = sanitizePlainText(aiResponse?.personalInfo?.headline || input.personalInfo?.headline || input.targetRole || "", strictAts);
        const safeProfile = sanitizePlainText(aiResponse?.profileText || input.profileText || "", strictAts);
        const aiExperiences = Array.isArray(aiResponse?.experiences) ? aiResponse.experiences : [];
        const safeExperiences = meaningfulExperiences.length === 0
            ? rawExperiences
            : meaningfulExperiences.map((orig, idx) => {
                const candidate = aiExperiences[idx];
                const cleanedBullets = Array.isArray(candidate?.bullets)
                    ? candidate.bullets
                        .map((b) => sanitizeBullet(String(b || ""), strictAts))
                        .filter(Boolean)
                    : [];
                const fallbackBullets = Array.isArray(orig.bullets)
                    ? orig.bullets.map((b) => sanitizeBullet(String(b || ""), strictAts)).filter(Boolean)
                    : [];
                return {
                    company: orig.company?.trim() || sanitizePlainText(candidate?.company || "", strictAts),
                    role: sanitizePlainText(candidate?.role || orig.role || "", strictAts),
                    startDate: sanitizePlainText(candidate?.startDate || orig.startDate || "", strictAts),
                    endDate: orig.endDate?.trim()
                        ? sanitizePlainText(candidate?.endDate || orig.endDate, strictAts)
                        : "",
                    bullets: cleanedBullets.length > 0 ? cleanedBullets : fallbackBullets.length > 0 ? fallbackBullets : [""],
                };
            });
        const aiEducation = Array.isArray(aiResponse?.education) ? aiResponse.education : [];
        const safeEducation = meaningfulEducation.length === 0
            ? rawEducation
            : meaningfulEducation.map((orig, idx) => {
                const candidate = aiEducation[idx];
                return {
                    institution: orig.institution?.trim() || sanitizePlainText(candidate?.institution || "", strictAts),
                    degree: sanitizePlainText(candidate?.degree || orig.degree || "", strictAts),
                    year: orig.year?.trim() || sanitizePlainText(candidate?.year || "", strictAts),
                };
            });
        const rawOutSkills = Array.isArray(aiResponse?.skills) ? aiResponse.skills : rawSkills;
        const seenSkills = new Set();
        const safeSkills = [];
        for (const sk of rawOutSkills) {
            const cleaned = sanitizePlainText(String(sk || ""), strictAts);
            if (!cleaned)
                continue;
            const key = cleaned.toLowerCase();
            if (seenSkills.has(key))
                continue;
            seenSkills.add(key);
            safeSkills.push(cleaned);
        }
        return {
            personalInfo: {
                headline: safeHeadline,
            },
            profileText: safeProfile,
            experiences: safeExperiences,
            education: safeEducation,
            skills: safeSkills.length > 0 ? safeSkills : rawSkills,
            optimizationMeta: {
                templateId,
                atsSafe: strictAts,
                appliedRules: strategy.appliedRules,
            },
        };
    }
    /**
     * Perfecciona el resumen profesional / perfil ejecutivo del candidato adaptado a su plantilla.
     */
    async improveProfile(input) {
        const templateId = normalizeTemplateId(input.templateId);
        const strictAts = templateId === "ats";
        const strategy = getTemplatePromptDirectives(templateId);
        const langName = input.language === "en" ? "Inglés (English)" : "Español (Spanish)";
        const prompt = `Actúa como un reclutador técnico experto y redactor profesional de CVs.
Tu tarea es perfeccionar el "Perfil Profesional" (Resumen Profesional) de un candidato alineado con el rol objetivo: "${input.targetRole || "Profesional TI"}" y adaptado a la plantilla "${strategy.label}".

${strategy.instructions}

El idioma de salida del párrafo resultante debe ser estrictamente: ${langName}.

Texto de perfil actual provisto por el usuario:
"${input.profileText || ""}"

Instrucciones:
1. Mejora gramática, redacción, vocabulario profesional y densidad natural de palabras clave para "${input.targetRole || "Profesional TI"}".
2. Debe ser un único párrafo conciso (3 a 4 oraciones, máximo 100 palabras).
3. NO agregues certificaciones, títulos ni años de experiencia que no estén respaldados en el texto original.
4. Devuelve texto plano limpio: SIN emojis, SIN Markdown (**negritas**) y SIN comillas innecesarias.

Devuelve ÚNICAMENTE un objeto JSON estructurado exactamente así:
{
  "refinedProfile": "Párrafo de perfil profesional mejorado en ${langName}"
}`;
        const result = await this.aiProvider.generateJson([{ text: prompt }], { temperature: strictAts ? 0.3 : 0.45 });
        return {
            refinedProfile: sanitizePlainText(result?.refinedProfile || input.profileText || "", strictAts),
        };
    }
}
exports.CvOptimizationService = CvOptimizationService;
//# sourceMappingURL=cv-optimization.service.js.map