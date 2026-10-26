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
 * Proporciona una interfaz unificada y simple para el flujo complejo de postulación:
 *  1. Genera una Carta de Presentación (Cover Letter) adaptada a la vacante con IA.
 *  2. Sintetiza una Hoja de Vida con palabras clave alineadas al perfil del trabajo.
 *  3. Construye y programa una entrevista técnica a la medida con el patrón Builder.
 *  4. Registra la postulación en la base de datos de manera persistente.
 */
class JobApplicationFacade {
    constructor(appRepo = new memory_job_application_repository_1.MemoryJobApplicationRepository()) {
        this.appRepo = appRepo;
    }
    /**
     * Ejecuta el flujo integral de postulación con IA y Builder.
     */
    async processCompleteApplication(params) {
        const { userId, job, userSkills = [], userExperienceSummary = "", createMockInterview = true } = params;
        // Paso 1: Generar carta de presentación adaptada
        const coverLetter = await this.generateTailoredCoverLetter(job, userSkills, userExperienceSummary);
        // Paso 2: Generar síntesis de CV adaptado (palabras clave ATS)
        const adaptedResumeSummary = this.generateAdaptedResumeSummary(job, userSkills);
        // Paso 3 (Opcional): Construir entrevista técnica a la medida con el patrón Builder
        let interviewId;
        if (createMockInterview) {
            try {
                const builder = new builder_1.InterviewBuilder();
                const director = new builder_1.InterviewDirector(builder);
                const tailoredQuestions = [
                    `¿Cómo estructurarías un sistema escalable para ${job.company} considerando el stack ${job.requiredSkills.slice(0, 3).join(", ")}?`,
                    `Describe un desafío técnico de alto impacto que hayas resuelto utilizando ${job.requiredSkills[0] || "tu tecnología principal"}.`,
                    `En este puesto de ${job.title}, ¿cómo gestionarías la deuda técnica y el testing automatizado?`,
                ];
                const interviewData = director.constructTechnicalInterview({
                    userId,
                    role: `${job.title} @ ${job.company}`,
                    level: job.seniority,
                    type: "Technical",
                    techstack: job.requiredSkills,
                    questions: tailoredQuestions,
                });
                interviewId = await (0, interviews_service_1.createInterview)(interviewData);
            }
            catch (e) {
                console.warn("[JobApplicationFacade] Advertencia creando entrevista técnica mock:", e);
            }
        }
        // Paso 4: Persistir la postulación
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
            interviewId,
            notes: params.notes,
        });
        const application = (await this.appRepo.getById(appId));
        return { application, interviewId };
    }
    /**
     * Genera una carta de presentación formal y persuasiva con el motor de IA.
     */
    async generateTailoredCoverLetter(job, userSkills, experience) {
        try {
            const provider = ai_provider_factory_1.AIProviderFactory.getProvider();
            const prompt = `Genera una carta de presentación (Cover Letter) profesional, persuasiva y concisa para postular a la vacante:
Puesto: ${job.title}
Empresa: ${job.company}
Ubicación: ${job.location}
Habilidades requeridas: ${job.requiredSkills.join(", ")}
Descripción: ${job.description.slice(0, 500)}

Perfil del candidato:
Habilidades clave: ${userSkills.join(", ") || "Desarrollo Full Stack, TypeScript, React"}
Experiencia previa: ${experience || "Desarrollador de software con experiencia construyendo aplicaciones escalables."}

La carta debe tener saludo formal, 3 párrafos sólidos (interés, valor que aporta, llamado a la acción) y despedida profesional. Responde solo con la carta.`;
            const res = await provider.generateJson([
                { text: prompt + "\nResponde en formato JSON: { \"coverLetter\": \"texto\" }" }
            ]);
            return res.coverLetter || "Carta generada exitosamente.";
        }
        catch {
            // Fallback determinista si no hay conexión a la IA
            return `Estimado equipo de contratación de ${job.company},\n\nMe dirijo a ustedes con gran entusiasmo para presentar mi candidatura al puesto de ${job.title}. Con sólida experiencia en ${(job.requiredSkills.slice(0, 3)).join(", ")}, considero que mi trayectoria aportará valor inmediato a sus objetivos de ingeniería.\n\nHe desarrollado aplicaciones robustas enfocadas en rendimiento, código limpio y buenas prácticas arquitecturales. La oportunidad de sumar mis competencias a ${job.company} resulta sumamente estimulante para mi desarrollo profesional.\n\nAgradezco de antemano el tiempo dedicado a revisar mi postulación y quedo a su entera disposición para conversar en una entrevista técnica.\n\nAtentamente,\nCandidato DevCareer AI`;
        }
    }
    generateAdaptedResumeSummary(job, userSkills) {
        const matched = userSkills.filter((s) => job.requiredSkills.some((r) => r.toLowerCase().includes(s.toLowerCase())));
        return `CV optimizado para ATS con énfasis en: ${matched.join(", ") || job.requiredSkills.slice(0, 4).join(", ")}. Perfil ajustado para el nivel ${job.seniority}.`;
    }
}
exports.JobApplicationFacade = JobApplicationFacade;
//# sourceMappingURL=job-application.facade.js.map