"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_provider_factory_1 = require("../services/ai/ai-provider.factory");
const builder_1 = require("../patterns/builder");
const interviews_service_1 = require("../services/interviews.service");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const jobs_service_1 = require("../services/jobs.service");
const bridge_1 = require("../patterns/bridge");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// GET /jobs
// Lista ofertas de empleo agregadas de los adaptadores con Match Score personalizado
router.get("/", async (req, res) => {
    try {
        const query = req.query.query;
        const platform = req.query.platform;
        // Habilidades por defecto o extraídas de la petición
        const skillsParam = req.query.skills;
        const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()) : ["TypeScript", "React", "Node.js", "AWS"];
        const jobs = await (0, jobs_service_1.getJobsForUser)(skills, query, platform);
        res.status(200).json({ success: true, jobs });
    }
    catch (error) {
        console.error("[JobsRoutes] Error obteniendo ofertas:", error);
        res.status(500).json({ success: false, message: "Error al consultar empleos" });
    }
});
// GET /jobs/applications
// Historial de postulaciones del usuario
router.get("/applications", async (req, res) => {
    try {
        const applications = await (0, jobs_service_1.getUserJobApplications)(req.userId);
        res.status(200).json({ success: true, applications });
    }
    catch (error) {
        console.error("[JobsRoutes] Error obteniendo postulaciones:", error);
        res.status(500).json({ success: false, message: "Error al obtener postulaciones" });
    }
});
// GET /jobs/applications/export?format=html|md|txt
// Patrón Bridge: Exporta el historial de postulaciones, métricas y cartas en el formato deseado
router.get("/applications/export", async (req, res) => {
    const format = req.query.format;
    const renderer = (0, bridge_1.resolveReportRenderer)(format);
    if (!renderer) {
        res.status(400).json({
            success: false,
            message: `Formato no soportado. Usa uno de: ${bridge_1.SUPPORTED_REPORT_FORMATS.join(", ")}`,
        });
        return;
    }
    try {
        const applications = await (0, jobs_service_1.getUserJobApplications)(req.userId);
        const report = new bridge_1.JobApplicationsReport(req.userId, applications, renderer);
        const { content, contentType, filename } = report.export();
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(content);
    }
    catch (error) {
        console.error("[JobsRoutes] Error exportando reporte de postulaciones:", error);
        res.status(500).json({ success: false, message: "Error al exportar reporte" });
    }
});
// POST /jobs/apply
// Patrón Facade: Procesa la postulación completa (Cover Letter IA + CV adaptado + Mock Interview)
router.post("/apply", async (req, res) => {
    const { job, userSkills, userExperienceSummary, notes } = req.body;
    if (!job || !job.title || !job.company) {
        res.status(400).json({ success: false, message: "Datos de la vacante requeridos" });
        return;
    }
    try {
        const result = await (0, jobs_service_1.applyToJob)({
            userId: req.userId,
            job,
            userSkills,
            userExperienceSummary,
            notes,
        });
        res.status(201).json({
            success: true,
            application: result.application,
            interviewId: result.interviewId,
            message: "Postulación procesada y simulacro de entrevista preparado con éxito.",
        });
    }
    catch (error) {
        console.error("[JobsRoutes] Error procesando postulación:", error);
        res.status(500).json({ success: false, message: "Error al procesar postulación" });
    }
});
// GET /jobs/:id
router.get("/:id", async (req, res) => {
    try {
        const job = await (0, jobs_service_1.getJobById)(req.params.id);
        if (!job) {
            res.status(404).json({ success: false, message: "Oferta no encontrada" });
            return;
        }
        res.status(200).json({ success: true, job });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error al consultar la oferta" });
    }
});
// POST /jobs/create-interview
// Patrón Builder (Director): Crea una entrevista técnica personalizada y adaptada
// a la descripción, empresa y tecnologías específicas de la vacante de empleo.
router.post("/create-interview", async (req, res) => {
    const { jobTitle, company, description, requiredSkills, seniority } = req.body;
    if (!jobTitle || !company) {
        res.status(400).json({ success: false, message: "jobTitle y company son requeridos" });
        return;
    }
    try {
        const provider = ai_provider_factory_1.AIProviderFactory.getProvider();
        const skills = Array.isArray(requiredSkills) && requiredSkills.length > 0
            ? requiredSkills
            : ["TypeScript", "React", "Node.js", "Arquitectura"];
        const level = seniority || "Mid-Level";
        const jobDesc = description || `Vacante para ${jobTitle} en ${company}`;
        const prompt = `Genera exactamente 5 preguntas técnicas y de diseño de software específicas y profundas para una entrevista laboral en ${company} para el rol de ${jobTitle} (${level}).
Stack Tecnológico: ${skills.join(", ")}.
Descripción y requisitos de la vacante:
${jobDesc.slice(0, 700)}

Las preguntas deben evaluar directamente los retos, responsabilidades y tecnologías de esta oferta en específico.
Responde ÚNICAMENTE un array JSON con las preguntas en español, sin texto adicional:
["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4", "Pregunta 5"]`;
        let questions = [];
        try {
            const aiQuestions = await provider.generateJson([
                { text: prompt + "\nResponde en formato JSON array: [\"pregunta 1\", \"pregunta 2\", ...]" }
            ]);
            if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
                questions = aiQuestions;
            }
        }
        catch {
            // Fallback contextualizado con la empresa y puesto
            questions = [
                `¿Cómo diseñarías y estructurarías la arquitectura para el puesto de ${jobTitle} en ${company} utilizando ${skills.slice(0, 3).join(", ")}?`,
                `Describe tu experiencia optimizando rendimiento, latencia y escalabilidad en aplicaciones con ${skills[0] || "TypeScript"}.`,
                `En ${company}, se requiere alta tolerancia a fallos. ¿Qué patrones de diseño o arquitecturales implementarías para garantizar resiliencia?`,
                `¿Cómo manejas el testing automatizado (unitario y de integración) y los pipelines CI/CD en proyectos con ${skills[1] || "React"}?`,
                `Explica un desafío técnico complejo que hayas resuelto recientemente relacionado con las responsabilidades de este puesto.`,
            ];
        }
        // Patrón Builder (Director): Ensambla la entrevista personalizada
        const builder = new builder_1.InterviewBuilder();
        const director = new builder_1.InterviewDirector(builder);
        const interviewData = director.constructTechnicalInterview({
            userId: req.userId,
            role: `${jobTitle} @ ${company}`,
            level,
            type: "Technical",
            techstack: skills,
            questions,
        });
        const interviewId = await (0, interviews_service_1.createInterview)(interviewData);
        res.status(201).json({
            success: true,
            interviewId,
            message: `Entrevista técnica personalizada para ${jobTitle} en ${company} creada exitosamente con 5 preguntas adaptadas.`,
        });
    }
    catch (error) {
        console.error("[JobsRoutes] Error creando entrevista personalizada para oferta:", error);
        res.status(500).json({ success: false, message: "Error al crear la entrevista personalizada" });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.routes.js.map