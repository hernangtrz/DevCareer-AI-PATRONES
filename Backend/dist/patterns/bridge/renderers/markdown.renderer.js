"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = void 0;
/**
 * Concrete Implementor: Markdown profesional (GitHub, Notion, Obsidian, portafolio).
 * Incluye tablas estructuradas, barras de progreso visuales Unicode, bloques ejecutivos
 * y secciones jerárquicas fáciles de leer por cualquier persona.
 */
class MarkdownRenderer {
    constructor() {
        this.format = "md";
        this.contentType = "text/markdown; charset=utf-8";
        this.fileExtension = "md";
    }
    escapeCell(text) {
        return String(text ?? "")
            .replace(/\|/g, "\\|")
            .replace(/\r?\n/g, " ")
            .trim();
    }
    buildBar(pct) {
        const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
        return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
    }
    getTierBadge(pct) {
        if (pct >= 80)
            return "🟢 Destacado";
        if (pct >= 60)
            return "🟡 Competitivo";
        return "🔴 Prioritario";
    }
    renderTitle(text) {
        const generatedAt = new Date().toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        return `# ${text}\n\n> **DevCareer AI** · Informe Ejecutivo de Evaluación · _Emitido el ${generatedAt}_`;
    }
    renderExecutiveSummary(highlight) {
        const pct = highlight.max > 0
            ? Math.max(0, Math.min(100, Math.round((highlight.score / highlight.max) * 100)))
            : 0;
        const statusIcon = highlight.status === "high" ? "🟢" : highlight.status === "mid" ? "🟡" : "🔴";
        const badgesLine = highlight.badges && highlight.badges.length > 0
            ? `\n> **Etiquetas clave:** ${highlight.badges.map((b) => `\`${b}\``).join(" · ")}`
            : "";
        return [
            `## Resumen Ejecutivo`,
            ``,
            `> ${statusIcon} **${highlight.verdictLabel}** — Puntaje Global: **${highlight.score}/${highlight.max}** (\`${this.buildBar(pct)}\` ${pct}%)`,
            `>`,
            `> ${highlight.verdictSummary}${badgesLine}`,
        ].join("\n");
    }
    renderKeyValueGrid(items) {
        const valid = items.filter((item) => item.value && item.value.trim().length > 0);
        if (valid.length === 0)
            return "";
        const rows = valid
            .map((item) => `| **${this.escapeCell(item.key)}** | ${this.escapeCell(item.value)} |`)
            .join("\n");
        return `| Campo | Detalle |\n| :--- | :--- |\n${rows}`;
    }
    renderChartSummary(title, items) {
        if (!items || items.length === 0)
            return "";
        const rows = items
            .map((item) => {
            const pct = item.max > 0 ? Math.max(0, Math.min(100, Math.round((item.score / item.max) * 100))) : 0;
            const obs = item.comment ? this.escapeCell(item.comment) : "—";
            return `| **${this.escapeCell(item.label)}** | **${item.score}/${item.max}** | ${this.getTierBadge(pct)} | \`${this.buildBar(pct)}\` ${pct}% | ${obs} |`;
        })
            .join("\n");
        return `### ${title}\n\n| Dimensión | Puntaje | Nivel | Progreso (Meta: 80%) | Observación |\n| :--- | :---: | :---: | :--- | :--- |\n${rows}`;
    }
    renderSection(heading) {
        return `---\n\n## ${heading}`;
    }
    renderParagraph(text) {
        if (!text || !text.trim())
            return "_Sin observaciones registradas._";
        return `> ${text.trim()}`;
    }
    renderListWithTone(items, tone) {
        if (items.length === 0)
            return "_Sin elementos registrados._";
        if (tone === "action") {
            return items.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
        }
        const prefix = tone === "positive" ? "- ✅" : tone === "improvement" ? "- 🎯" : "-";
        return items.map((item) => `${prefix} ${item}`).join("\n");
    }
    renderList(items) {
        return this.renderListWithTone(items, "neutral");
    }
    renderScore(label, score, max, comment) {
        const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
        const base = `- **${label}:** **${score}/${max}** (${this.getTierBadge(pct)} · \`${this.buildBar(pct)}\` ${pct}%)`;
        return comment ? `${base}\n  - _${comment}_` : base;
    }
    renderKeyValue(key, value) {
        return `- **${key}:** ${value}`;
    }
    compose(_title, blocks) {
        const body = blocks.filter(Boolean).join("\n\n");
        return `${body}\n\n---\n\n_Generado por **DevCareer AI** · Plataforma de Preparación Técnica y Empleabilidad con IA._\n`;
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
//# sourceMappingURL=markdown.renderer.js.map