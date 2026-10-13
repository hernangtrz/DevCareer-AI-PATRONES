"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnglishProficiencyReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
/**
 * Refined Abstraction: Reporte de competencia en inglés (marco CEFR A1–C2).
 */
class EnglishProficiencyReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(interviewId, english, renderer) {
        super(renderer);
        this.interviewId = interviewId;
        this.english = english;
    }
    getTitle() {
        return "English Proficiency Report (CEFR) - DevCareer AI";
    }
    getBaseFilename() {
        return `english-cefr-${this.interviewId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const e = this.english;
        return [
            r.renderKeyValue("Interview", this.interviewId),
            r.renderKeyValue("CEFR Level", e.overallLevel),
            r.renderSection("Scores"),
            r.renderScore("Grammar", e.grammarScore, 100),
            r.renderScore("Vocabulary", e.vocabularyScore, 100),
            r.renderScore("Fluency", e.fluencyScore, 100),
            r.renderSection("Grammar Errors Detected"),
            r.renderList(e.grammarErrors || []),
            r.renderSection("Vocabulary Suggestions"),
            r.renderList(e.vocabularySuggestions || []),
            r.renderSection("Overall Comment"),
            r.renderParagraph(e.overallComment || ""),
        ];
    }
}
exports.EnglishProficiencyReport = EnglishProficiencyReport;
//# sourceMappingURL=english-proficiency.report.js.map