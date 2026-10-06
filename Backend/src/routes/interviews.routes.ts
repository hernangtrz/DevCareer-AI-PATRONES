import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import {
  getInterviewsByUserId,
  getLatestInterviews,
  getInterviewById,
  createInterviewFromTemplate,
  cloneInterview,
} from "../services/interviews.service";
import { InterviewPrototypeRegistry } from "../patterns/prototype";

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// GET /interviews/mine
// Entrevistas del usuario autenticado
router.get("/mine", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await getInterviewsByUserId(req.userId!);
    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error("Error obteniendo entrevistas del usuario:", error);
    res.status(500).json({ success: false, message: "Error al obtener entrevistas" });
  }
});

// GET /interviews/latest?limit=20
// Entrevistas finalizadas de otros usuarios (para el dashboard)
router.get("/latest", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const interviews = await getLatestInterviews(req.userId!, limit);
    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error("Error obteniendo últimas entrevistas:", error);
    res.status(500).json({ success: false, message: "Error al obtener entrevistas" });
  }
});

// GET /interviews/prototypes/templates
// Patrón Prototype: Lista los identificadores de arquetipos de entrevistas disponibles en el catálogo
router.get("/prototypes/templates", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registry = InterviewPrototypeRegistry.getInstance();
    const availableKeys = registry.listKeys();
    res.status(200).json({ success: true, templates: availableKeys });
  } catch (error) {
    console.error("Error listando prototipos de plantilla:", error);
    res.status(500).json({ success: false, message: "Error al consultar plantillas" });
  }
});

// GET /interviews/:id
// Entrevista por ID
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await getInterviewById(req.params.id);

    if (!interview) {
      res.status(404).json({ success: false, message: "Entrevista no encontrada" });
      return;
    }

    res.status(200).json({ success: true, interview });
  } catch (error) {
    console.error("Error obteniendo entrevista:", error);
    res.status(500).json({ success: false, message: "Error al obtener la entrevista" });
  }
});

// POST /interviews/from-template
// Patrón Prototype: Crea una entrevista clonando un arquetipo registrado en el catálogo
router.post("/from-template", async (req: AuthRequest, res: Response): Promise<void> => {
  const { templateId } = req.body;

  if (!templateId) {
    res.status(400).json({ success: false, message: "templateId requerido" });
    return;
  }

  try {
    const interviewId = await createInterviewFromTemplate(templateId, req.userId!);

    if (!interviewId) {
      res.status(404).json({ success: false, message: "Plantilla arquetípica no encontrada en el registro" });
      return;
    }

    res.status(201).json({ success: true, interviewId });
  } catch (error) {
    console.error("Error creando entrevista desde plantilla prototype:", error);
    res.status(500).json({ success: false, message: "Error al crear la entrevista" });
  }
});

// POST /interviews/:id/clone
// Patrón Prototype: Clona una entrevista histórica existente para reintentar la práctica
router.post("/:id/clone", async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const clonedInterviewId = await cloneInterview(id, req.userId!);

    if (!clonedInterviewId) {
      res.status(404).json({ success: false, message: "Entrevista a clonar no encontrada" });
      return;
    }

    res.status(201).json({
      success: true,
      interviewId: clonedInterviewId,
      message: "Entrevista clonada exitosamente para nueva práctica.",
    });
  } catch (error) {
    console.error("Error clonando entrevista:", error);
    res.status(500).json({ success: false, message: "Error al clonar la entrevista" });
  }
});

export default router;
