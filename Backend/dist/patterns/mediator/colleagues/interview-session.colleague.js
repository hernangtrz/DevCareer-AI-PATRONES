"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewSessionColleague = void 0;
const base_colleague_1 = require("../base.colleague");
const builder_1 = require("../../builder");
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 2: InterviewSessionColleague
 * ============================================================================
 * Gestiona la preparación reactiva de simulacros de entrevista y la actualización
 * del ciclo de vida de las sesiones. Colabora internamente con el patrón Builder
 * sin acoplarse a los módulos de Empleos, Feedback ni Analítica.
 */
class InterviewSessionColleague extends base_colleague_1.BaseColleague {
    constructor(interviewRepo, mediator) {
        super(mediator);
        this.colleagueName = "InterviewSessionColleague";
        this.interviewRepo = interviewRepo;
    }
    getRepo() {
        if (!this.interviewRepo) {
            // Resolución perezosa para evitar acoplar la carga del módulo a variables de entorno de BD
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { RepositoryFactory } = require("../../../repositories/repository.factory");
            this.interviewRepo = RepositoryFactory.getInterviewRepository();
        }
        return this.interviewRepo;
    }
    /**
     * Acción invocada por el Mediador cuando una postulación de empleo avanza
     * al estado `"interviewing"`, ensamblando una entrevista simulada a medida.
     */
    async prepareInterviewForJobStage(params) {
        const { userId, jobTitle, company, techstack } = params;
        const skills = Array.isArray(techstack) && techstack.length > 0
            ? techstack
            : ["TypeScript", "Node.js", "System Design"];
        const builder = new builder_1.InterviewBuilder();
        const director = new builder_1.InterviewDirector(builder);
        const questions = [
            `¿Cómo diseñarías la arquitectura principal para el rol de ${jobTitle} en ${company} empleando ${skills.slice(0, 3).join(", ")}?`,
            `Describe un escenario crítico de escalabilidad o latencia que hayas resuelto con ${skills[0] || "TypeScript"}.`,
            `¿Qué patrones de diseño GoF y principios SOLID aplicarías en los microservicios de ${company}?`,
        ];
        const interviewData = director.constructTechnicalInterview({
            userId,
            role: `${jobTitle} @ ${company}`,
            company,
            level: "Mid-Senior",
            type: "Technical",
            techstack: skills,
            questions,
        });
        return this.getRepo().create(interviewData);
    }
    /**
     * Acción invocada por el Mediador cuando se detectan brechas técnicas en el
     * análisis de CV ATS o en la Arena de Retos de Código.
     */
    async createTargetedRefresherInterview(params) {
        const { userId, targetRole, missingSkills, source } = params;
        const skills = missingSkills.length > 0 ? missingSkills : ["Clean Architecture", "SOLID"];
        const builder = new builder_1.InterviewBuilder();
        const director = new builder_1.InterviewDirector(builder);
        const focusLabel = source === "cv-ats" ? "Refuerzo ATS" : "Refuerzo Algorítmico & SOLID";
        const questions = skills.slice(0, 3).map((skill) => `[${focusLabel}] Explica en profundidad cómo implementarías y optimizarías una solución en producción utilizando ${skill} para el puesto de ${targetRole}.`);
        const interviewData = director.constructTechnicalInterview({
            userId,
            role: `${targetRole} (${focusLabel})`,
            level: "Mid-Level",
            type: "Technical",
            techstack: skills,
            questions,
        });
        return this.getRepo().create(interviewData);
    }
    /**
     * Acción invocada por el Mediador cuando `EvaluationFeedbackColleague`
     * finaliza la evaluación de una entrevista, marcándola como `finalized: true`
     * y recuperando sus metadatos para sincronizar otros colegas.
     */
    async finalizeAndGetMetadata(interviewId) {
        try {
            const repo = this.getRepo();
            const existing = await repo.getById(interviewId);
            if (!existing) {
                return null;
            }
            if (!existing.finalized) {
                await repo.update({
                    ...existing,
                    finalized: true,
                });
            }
            let company = existing.company;
            let role = existing.role;
            if (!company && role && role.includes(" @ ")) {
                const [cleanRole, parsedCompany] = role.split(" @ ");
                role = cleanRole.trim();
                company = parsedCompany.trim();
            }
            return {
                role,
                company,
                techstack: existing.techstack,
            };
        }
        catch {
            return null;
        }
    }
}
exports.InterviewSessionColleague = InterviewSessionColleague;
//# sourceMappingURL=interview-session.colleague.js.map