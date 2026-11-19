"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindspotDetectionVisitor = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 2 (BlindspotDetectionVisitor)
 * ============================================================================
 * Inspecciona minuciosamente cada elemento para extraer fallas ocultas,
 * debilidades o inconsistencias (puntos ciegos) que descalifican al candidato.
 */
class BlindspotDetectionVisitor {
    constructor() {
        this.visitorName = "BlindspotDetectionVisitor";
        this.blindspots = [];
    }
    visitInterview(interview) {
        if (!interview.finalized) {
            this.blindspots.push({
                elementId: interview.id,
                sourceType: "interview",
                severity: "LOW",
                title: "Sesión de entrevista incompleta",
                issue: `La sesión para "${interview.role} en ${interview.company}" no fue finalizada.`,
                recommendation: "Completa el simulacro de voz para que el modelo genere retroalimentación objetiva.",
            });
            return;
        }
        if (interview.technicalScore < 70) {
            this.blindspots.push({
                elementId: interview.id,
                sourceType: "interview",
                severity: "HIGH",
                title: "Brecha en profundidad técnica",
                issue: `Puntaje técnico de ${interview.technicalScore}/100 en entrevista de ${interview.role}.`,
                recommendation: `Repasar fundamentos teóricos y diseño de sistemas en ${interview.techStack.join(", ")}.`,
            });
        }
        if (["A1", "A2", "B1"].includes(interview.cefrLevel)) {
            this.blindspots.push({
                elementId: interview.id,
                sourceType: "interview",
                severity: "HIGH",
                title: "Nivel de inglés insuficiente para ofertas internacionales",
                issue: `Nivel detectado (${interview.cefrLevel}) por debajo del umbral estándar B2 para trabajo remoto global.`,
                recommendation: "Entrenar respuestas técnicas en inglés enfatizando terminología de ingeniería y conectores.",
            });
        }
        if (interview.communicationScore < 65) {
            this.blindspots.push({
                elementId: interview.id,
                sourceType: "interview",
                severity: "MEDIUM",
                title: "Estructura de respuesta difusa",
                issue: `Calificación de comunicación de ${interview.communicationScore}/100.`,
                recommendation: "Aplicar el método STAR (Situación, Tarea, Acción, Resultado) para ordenar las respuestas.",
            });
        }
    }
    visitCodeChallenge(challenge) {
        if (!challenge.passed || challenge.passRatio < 100) {
            this.blindspots.push({
                elementId: challenge.id,
                sourceType: "code_challenge",
                severity: "HIGH",
                title: "Pruebas unitarias fallidas en reto de código",
                issue: `Aprobó solo ${challenge.testsPassed} de ${challenge.totalTests} pruebas en "${challenge.challengeTitle}".`,
                recommendation: "Cubrir casos de borde (edge cases) como entradas nulas, arreglos vacíos y desbordamientos.",
            });
        }
        if (challenge.cyclomaticComplexity > 10) {
            this.blindspots.push({
                elementId: challenge.id,
                sourceType: "code_challenge",
                severity: "MEDIUM",
                title: "Complejidad ciclomática excesiva",
                issue: `Complejidad ciclomática calculada en ${challenge.cyclomaticComplexity} (máximo recomendado: 10).`,
                recommendation: "Descomponer la función en métodos auxiliares y evitar anidamientos profundos de if/for.",
            });
        }
    }
    visitJobApplication(application) {
        if (application.matchScore < 65) {
            this.blindspots.push({
                elementId: application.id,
                sourceType: "job_application",
                severity: "MEDIUM",
                title: "Desalineación de perfil con vacante postulada",
                issue: `Afinidad calculada de solo ${application.matchScore}% para ${application.jobTitle} en ${application.company}.`,
                recommendation: "Enfocar las postulaciones en ofertas donde el match score supere el 75% para optimizar conversión.",
            });
        }
        if (application.status === "rejected" && (!application.notes || application.notes.trim().length === 0)) {
            this.blindspots.push({
                elementId: application.id,
                sourceType: "job_application",
                severity: "LOW",
                title: "Postulación descartada sin bitácora de aprendizaje",
                issue: `La vacante en ${application.company} fue descartada pero no tiene notas de retroalimentación.`,
                recommendation: "Anota el feedback recibido o las preguntas difíciles para repasar en la siguiente entrevista.",
            });
        }
    }
    visitCvAts(cvAnalysis) {
        if (cvAnalysis.missingKeywords.length > 2) {
            this.blindspots.push({
                elementId: cvAnalysis.id,
                sourceType: "cv_ats",
                severity: "HIGH",
                title: "Palabras clave esenciales ausentes en CV para filtros ATS",
                issue: `Faltan tecnologías clave exigidas por reclutadores: ${cvAnalysis.missingKeywords.slice(0, 4).join(", ")}.`,
                recommendation: "Incorporar estas tecnologías con ejemplos de logros cuantificables en tu experiencia laboral.",
            });
        }
        if (cvAnalysis.formattingIssues.length > 0) {
            this.blindspots.push({
                elementId: cvAnalysis.id,
                sourceType: "cv_ats",
                severity: "MEDIUM",
                title: "Incompatibilidad de formato con parsers ATS",
                issue: `Se detectaron ${cvAnalysis.formattingIssues.length} problemas de maquetación en el documento.`,
                recommendation: `Resolver: ${cvAnalysis.formattingIssues.join(", ")}. Utilizar tipografía estándar y layout a una sola columna.`,
            });
        }
    }
    /**
     * Genera el reporte estructurado de puntos ciegos y plan de acción prioritario
     */
    getReport() {
        const highSeverityCount = this.blindspots.filter((b) => b.severity === "HIGH").length;
        const actionPlan = [];
        if (highSeverityCount > 0) {
            actionPlan.push(`Resolver con prioridad ${highSeverityCount} brecha(s) crítica(s) de inglés o pruebas técnicas.`);
        }
        if (this.blindspots.some((b) => b.sourceType === "cv_ats")) {
            actionPlan.push("Actualizar palabras clave en la hoja de vida antes de enviar nuevas postulaciones.");
        }
        if (this.blindspots.some((b) => b.sourceType === "code_challenge")) {
            actionPlan.push("Practicar refactorización y modularidad para reducir la complejidad ciclomática del código.");
        }
        if (actionPlan.length === 0) {
            actionPlan.push("¡Sin puntos ciegos críticos detectados! El perfil muestra alta consistencia profesional.");
        }
        return {
            visitorName: this.visitorName,
            totalBlindspots: this.blindspots.length,
            highSeverityCount,
            blindspots: this.blindspots,
            actionPlan,
        };
    }
}
exports.BlindspotDetectionVisitor = BlindspotDetectionVisitor;
//# sourceMappingURL=blindspot-detection.visitor.js.map