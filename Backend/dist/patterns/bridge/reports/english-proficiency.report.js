"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnglishProficiencyReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
const report_schemas_1 = require("../report-schemas");
const CEFR_EXPLANATIONS = {
    C2: {
        label: "C2 · Maestría Profesional",
        description: "Dominio prácticamente nativo: comunicación precisa, fluida y matizada para liderazgo internacional.",
        status: "high",
    },
    C1: {
        label: "C1 · Avanzado Profesional",
        description: "Alta fluidez y vocabulario técnico sólido para entrevistas y equipos globales de ingeniería.",
        status: "high",
    },
    B2: {
        label: "B2 · Intermedio Alto (Estándar Global)",
        description: "Comunicación clara y autónoma en entornos técnicos en inglés; ideal para roles remotos internacionales.",
        status: "high",
    },
    B1: {
        label: "B1 · Intermedio Funcional",
        description: "Expresa ideas técnicas principales con comprensión general, pero conviene reforzar fluidez y precisión gramatical.",
        status: "mid",
    },
    A2: {
        label: "A2 · Elemental",
        description: "Comunicación en frases cortas y vocabulario básico; se recomienda práctica conversacional guiada antes de entrevistas en inglés.",
        status: "low",
    },
    A1: {
        label: "A1 · Principiante",
        description: "Nivel inicial; enfócate en vocabulario técnico esencial y estructuras de presentación profesional.",
        status: "low",
    },
};
/**
 * Refined Abstraction: Reporte ejecutivo de competencia en inglés (marco CEFR A1–C2).
 */
class EnglishProficiencyReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(interviewId, english, renderer, context) {
        super(renderer);
        this.interviewId = interviewId;
        this.english = english;
        this.context = context;
    }
    getTitle() {
        return "Evaluación Lingüística de Inglés (CEFR) — DevCareer AI";
    }
    getBaseFilename() {
        return `english-cefr-${this.interviewId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const e = report_schemas_1.EnglishFeedbackReportSchema.parse(this.english);
        const ctx = report_schemas_1.InterviewReportContextSchema.parse(this.context);
        const avgScore = Math.round((e.grammarScore + e.vocabularyScore + e.fluencyScore) / 3);
        const levelKey = (e.overallLevel || "B1").trim().toUpperCase().slice(0, 2);
        const cefrInfo = CEFR_EXPLANATIONS[levelKey] || {
            label: `Nivel CEFR ${e.overallLevel}`,
            description: "Evaluación integral de gramática, vocabulario técnico y fluidez oral durante la entrevista.",
            status: avgScore >= 75 ? "high" : avgScore >= 55 ? "mid" : "low",
        };
        const metrics = [
            {
                label: "Gramática (Grammar)",
                score: e.grammarScore,
                max: 100,
                comment: "Precisión en tiempos verbales, concordancia y estructura de oraciones.",
            },
            {
                label: "Vocabulario Técnico (Vocabulary)",
                score: e.vocabularyScore,
                max: 100,
                comment: "Riqueza léxica y uso apropiado de terminología de ingeniería de software.",
            },
            {
                label: "Fluidez Conversacional (Fluency)",
                score: e.fluencyScore,
                max: 100,
                comment: "Continuidad, ritmo natural y claridad al explicar decisiones técnicas.",
            },
        ];
        const highlight = {
            score: avgScore,
            max: 100,
            verdictLabel: cefrInfo.label,
            verdictSummary: cefrInfo.description,
            status: cefrInfo.status,
            badges: [
                `CEFR ${e.overallLevel}`,
                ...(ctx?.role ? [ctx.role] : []),
                ...(ctx?.company ? [ctx.company] : []),
            ],
        };
        const metaItems = [
            ...(ctx?.candidateName ? [{ key: "Candidato", value: ctx.candidateName }] : []),
            ...(ctx?.role ? [{ key: "Rol Evaluado", value: ctx.role }] : []),
            { key: "Nivel CEFR Asignado", value: e.overallLevel },
            { key: "Promedio Lingüístico", value: `${avgScore}/100` },
            { key: "ID de Entrevista", value: this.interviewId },
        ];
        const blocks = [];
        if (r.renderExecutiveSummary) {
            blocks.push(r.renderExecutiveSummary(highlight));
        }
        else {
            blocks.push(r.renderKeyValue("CEFR Level", e.overallLevel));
            blocks.push(r.renderScore("Promedio Inglés", avgScore, 100));
        }
        if (r.renderKeyValueGrid) {
            blocks.push(r.renderKeyValueGrid(metaItems));
        }
        else {
            metaItems.forEach((item) => blocks.push(r.renderKeyValue(item.key, item.value)));
        }
        if (r.renderChartSummary) {
            blocks.push(r.renderChartSummary("Desglose Visual de Competencias en Inglés", metrics));
        }
        blocks.push(r.renderSection("Puntajes por Dimensión Lingüística"));
        metrics.forEach((m) => blocks.push(r.renderScore(m.label, m.score, m.max, m.comment)));
        blocks.push(r.renderSection("Correcciones Gramaticales Detectadas"));
        const grammarErrors = e.grammarErrors || [];
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(grammarErrors, "improvement")
            : r.renderList(grammarErrors));
        blocks.push(r.renderSection("Sugerencias de Vocabulario Profesional"));
        const vocabSuggestions = e.vocabularySuggestions || [];
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(vocabSuggestions, "action")
            : r.renderList(vocabSuggestions));
        blocks.push(r.renderSection("Diagnóstico General del Evaluador"));
        blocks.push(r.renderParagraph(e.overallComment || ""));
        return blocks;
    }
}
exports.EnglishProficiencyReport = EnglishProficiencyReport;
//# sourceMappingURL=english-proficiency.report.js.map