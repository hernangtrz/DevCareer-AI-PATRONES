import { AIProviderFactory } from "../services/ai/ai-provider.factory";
import { InterviewBuilder, InterviewDirector } from "../patterns/builder";
import { createInterview } from "../services/interviews.service";
import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import {
  getJobsForUser,
  getJobById,
  applyToJob,
  getUserJobApplications,
} from "../services/jobs.service";
import {
  resolveReportRenderer,
  JobApplicationsReport,
  SUPPORTED_REPORT_FORMATS,
} from "../patterns/bridge";

const router = Router();
router.use(requireAuth);

// GET /jobs
// Lista ofertas de empleo agregadas de los adaptadores con Match Score personalizado
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const platform = req.query.platform as string | undefined;
    // Habilidades por defecto o extraídas de la petición
    const skillsParam = req.query.skills as string | undefined;
    const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()) : ["TypeScript", "React", "Node.js", "AWS"];

    const jobs = await getJobsForUser(skills, query, platform);
    res.status(200).json({ success: true, jobs });
  } catch (error: any) {
    console.error("[JobsRoutes] Error obteniendo ofertas:", error);
    res.status(500).json({ success: false, message: "Error al consultar empleos" });
  }
});

// GET /jobs/applications
// Historial de postulaciones del usuario
router.get("/applications", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await getUserJobApplications(req.userId!);
    res.status(200).json({ success: true, applications });
  } catch (error: any) {
    console.error("[JobsRoutes] Error obteniendo postulaciones:", error);
    res.status(500).json({ success: false, message: "Error al obtener postulaciones" });
  }
});

// GET /jobs/applications/export?format=html|md|txt
// Patrón Bridge: Exporta el historial de postulaciones, métricas y cartas en el formato deseado
router.get("/applications/export", async (req: AuthRequest, res: Response): Promise<void> => {
  const format = req.query.format as string | undefined;
  const renderer = resolveReportRenderer(format);

  if (!renderer) {
    res.status(400).json({
      success: false,
      message: `Formato no soportado. Usa uno de: ${SUPPORTED_REPORT_FORMATS.join(", ")}`,
    });
    return;
  }

  try {
    const applications = await getUserJobApplications(req.userId!);
    const report = new JobApplicationsReport(req.userId!, applications, renderer);

    const { content, contentType, filename } = report.export();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (error: any) {
    console.error("[JobsRoutes] Error exportando reporte de postulaciones:", error);
    res.status(500).json({ success: false, message: "Error al exportar reporte" });
  }
});

// POST /jobs/apply
// Patrón Facade: Procesa la postulación completa (Cover Letter IA + CV adaptado + Mock Interview)
router.post("/apply", async (req: AuthRequest, res: Response): Promise<void> => {
  const { job, userSkills, userExperienceSummary, notes } = req.body;

  if (!job || !job.title || !job.company) {
    res.status(400).json({ success: false, message: "Datos de la vacante requeridos" });
    return;
  }

  try {
    const result = await applyToJob({
      userId: req.userId!,
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
  } catch (error: any) {
    console.error("[JobsRoutes] Error procesando postulación:", error);
    res.status(500).json({ success: false, message: "Error al procesar postulación" });
  }
});

// GET /jobs/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, message: "Oferta no encontrada" });
      return;
    }
    res.status(200).json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error al consultar la oferta" });
  }
});


// POST /jobs/create-interview
// Patrón Builder (Director): Crea una entrevista técnica personalizada y adaptada
// a la descripción, empresa y tecnologías específicas de la vacante de empleo.
router.post("/create-interview", async (req: AuthRequest, res: Response): Promise<void> => {
  const { jobTitle, company, description, requiredSkills, seniority } = req.body;

  if (!jobTitle || !company) {
    res.status(400).json({ success: false, message: "jobTitle y company son requeridos" });
    return;
  }

  try {

    const provider = AIProviderFactory.getProvider();
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

    let questions: string[] = [];
    try {
      const aiQuestions = await provider.generateJson<string[]>([
        { text: prompt + "\nResponde en formato JSON array: [\"pregunta 1\", \"pregunta 2\", ...]" }
      ]);
      if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
        questions = aiQuestions;
      }
    } catch {
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
    const builder = new InterviewBuilder();
    const director = new InterviewDirector(builder);

    const interviewData = director.constructTechnicalInterview({
      userId: req.userId!,
      role: `${jobTitle} @ ${company}`,
      level,
      type: "Technical",
      techstack: skills,
      questions,
    });

    const interviewId = await createInterview(interviewData);

    res.status(201).json({
      success: true,
      interviewId,
      message: `Entrevista técnica personalizada para ${jobTitle} en ${company} creada exitosamente con 5 preguntas adaptadas.`,
    });
  } catch (error: any) {
    console.error("[JobsRoutes] Error creando entrevista personalizada para oferta:", error);
    res.status(500).json({ success: false, message: "Error al crear la entrevista personalizada" });
  }
});

export default router;
