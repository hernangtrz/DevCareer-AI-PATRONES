"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationFacade = void 0;
const memory_job_application_repository_1 = require("../../repositories/memory-job-application.repository");
const ai_provider_factory_1 = require("../../services/ai/ai-provider.factory");
const builder_1 = require("../builder");
const interviews_service_1 = require("../../services/interviews.service");
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Fachada de Alto Nivel que orquesta y encapsula el flujo completo de postulación
 * laboral en DevCareer AI coordinando 4 subsistemas complejos:
 *
 *  1. Subsistema de IA (AIProviderFactory / IAIProvider):
 *     Genera una Carta de Presentación / Motivación (Cover Letter) persuasiva
 *     y una Hoja de Vida Adaptada al cargo y tecnologías requeridas.
 *
 *  2. Subsistema Builder (InterviewDirector & InterviewBuilder):
 *     Construye un simulacro técnico personalizado a la medida de la empresa,
 *     el rol y el stack de la vacante.
 *
 *  3. Subsistema de Entrevistas (interviews.service):
 *     Registra la entrevista técnica para que el usuario pueda practicar.
 *
 *  4. Subsistema de Persistencia (IJobApplicationRepository):
 *     Almacena la postulación con todos los materiales generados y notas de seguimiento.
 */
class JobApplicationFacade {
    constructor(appRepo = new memory_job_application_repository_1.MemoryJobApplicationRepository()) {
        this.appRepo = appRepo;
    }
    /**
     * Procesa la postulación completa coordinando concurrentemente IA, Builder y Persistencia.
     */
    async processCompleteApplication(params) {
        const { userId, job, userSkills = ["TypeScript", "React", "Node.js"], userExperienceSummary = "Desarrollador de software con experiencia en arquitecturas escalables", notes = "", } = params;
        // 1. Generar Carta de Motivación y Hoja de Vida Adaptada con IA (o fallback seguro)
        const { coverLetter, adaptedResumeSummary } = await this.generateApplicationMaterials(job, userSkills, userExperienceSummary);
        // 2. Construir y persistir Simulacro Técnico con Patrón Builder
        let interviewId;
        try {
            const director = new builder_1.InterviewDirector(new builder_1.InterviewBuilder());
            const technicalQuestions = this.deriveQuestionsForJob(job);
            const interviewData = director.constructTechnicalInterview({
                userId,
                role: job.title,
                company: job.company,
                level: job.seniority || "Mid-Level",
                type: "Technical",
                techstack: job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : ["TypeScript", "React"],
                questions: technicalQuestions,
                coverImage: "/covers/technical-prep.png",
            });
            interviewId = await (0, interviews_service_1.createInterview)(interviewData);
        }
        catch (err) {
            console.warn("[JobApplicationFacade] Advertencia construyendo entrevista con Builder:", err);
            interviewId = `int-${Date.now()}`;
        }
        // 3. Persistir Postulación en Repositorio con todos los materiales
        const appId = await this.appRepo.create({
            userId,
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            platform: job.platform,
            location: job.location,
            salary: job.salary,
            appliedAt: new Date().toISOString(),
            status: "applied",
            coverLetter,
            adaptedResumeSummary,
            matchScore: job.matchScore || 85,
            notes,
            url: job.url,
            techstack: job.requiredSkills || [],
            interviewId,
        });
        const application = (await this.appRepo.getById(appId));
        return {
            application,
            interviewId,
            coverLetter,
            adaptedResumeSummary,
        };
    }
    /**
     * Subsistema de Generación de Materiales con IA
     */
    async generateApplicationMaterials(job, userSkills, userExperienceSummary) {
        try {
            const provider = ai_provider_factory_1.AIProviderFactory.getProvider();
            const prompt = `Actúa como un experto en reclutamiento técnico internacional.
Genera una carta de presentación formal y una hoja de vida adaptada para el siguiente puesto de trabajo:
- Empresa: ${job.company}
- Cargo: ${job.title}
- Ubicación: ${job.location || "Remoto"}
- Tecnologías requeridas: ${job.requiredSkills?.join(", ") || "Desarrollo de Software"}
- Habilidades del candidato: ${userSkills.join(", ")}
- Resumen del perfil: ${userExperienceSummary}

Responde estrictamente con un objeto JSON válido con la siguiente estructura:
{
  "coverLetter": "Texto completo y bien redactado de la carta de presentación/motivación dirigida al equipo de selección de ${job.company}...",
  "adaptedResumeSummary": "Resumen profesional adaptado para destacar en esta postulación, con 3 viñetas de logros relevantes enfocados en las tecnologías requeridas..."
}`;
            const aiResult = await provider.generateJson([{ text: prompt }]);
            if (aiResult && aiResult.coverLetter && aiResult.adaptedResumeSummary) {
                return {
                    coverLetter: aiResult.coverLetter,
                    adaptedResumeSummary: aiResult.adaptedResumeSummary,
                };
            }
        }
        catch (err) {
            console.warn("[JobApplicationFacade] Inferencia de IA no disponible, utilizando plantilla enriquecida:", err);
        }
        // Fallback robusto garantizado:
        return this.generateFallbackMaterials(job, userSkills);
    }
    /**
     * Generador de fallback de alta calidad en caso de contingencia o tests offline
     */
    generateFallbackMaterials(job, userSkills) {
        const skillsList = job.requiredSkills?.length
            ? job.requiredSkills.join(", ")
            : userSkills.join(", ");
        const coverLetter = `Estimado equipo de selección de ${job.company},

Me dirijo a ustedes con gran entusiasmo para presentar mi candidatura a la posición de ${job.title}. Con una sólida experiencia en desarrollo de software y dominio práctico en tecnologías clave como ${skillsList}, considero que mis competencias técnicas y enfoque en arquitectura limpia aportarán un valor tangible a sus objetivos en ${job.company}.

A lo largo de mi trayectoria he trabajado implementando arquitecturas escalables, buenas prácticas de ingeniería y optimización continua de procesos en equipos de alto rendimiento. Me motiva profundamente la cultura y desafíos técnicos de ${job.company}, y estoy convencido de que mi perfil se alinea con las expectativas del puesto.

Agradezco de antemano su atención a mi postulación y quedo a su entera disposición para profundizar en mi experiencia a través de una entrevista.

Atentamente,
Candidato DevCareer AI`;
        const adaptedResumeSummary = `RESUMEN PROFESIONAL ADAPTADO PARA ${job.company.toUpperCase()}:
Desarrollador de software con perfil orientado a la resolución de problemas técnicos complejos y entrega de valor ágil, con competencias alineadas a los requisitos de ${job.title}.

FORTALEZAS CLAVE PARA ESTA VACANTE:
• Experiencia práctica en el stack requerido: ${skillsList}.
• Adherencia a patrones de diseño GoF, principios SOLID y testing automatizado.
• Capacidad de comunicación técnica clara y trabajo efectivo en entornos remotos.`;
        return { coverLetter, adaptedResumeSummary };
    }
    /**
     * Deriva preguntas técnicas relevantes para la vacante
     */
    deriveQuestionsForJob(job) {
        const primarySkill = job.requiredSkills?.[0] || "TypeScript";
        const secondarySkill = job.requiredSkills?.[1] || "arquitectura de software";
        return [
            `¿Podrías presentarte brevemente y contarnos sobre tu experiencia con ${primarySkill} en proyectos anteriores?`,
            `En ${job.company} valoramos mucho la escalabilidad. ¿Cómo diseñarías una solución modular utilizando ${secondarySkill}?`,
            `Cuéntanos sobre algún problema de concurrencia o rendimiento que hayas resuelto recientemente en tu código.`,
            `¿Cómo garantizas la mantenibilidad y calidad en tus entregas de software bajo estándares de diseño limpio?`,
        ];
    }
}
exports.JobApplicationFacade = JobApplicationFacade;
//# sourceMappingURL=job-application.facade.js.map