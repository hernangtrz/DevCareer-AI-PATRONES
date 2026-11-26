import {
  ExecutiveHighlight,
  IReportRenderer,
  KeyValueItem,
  ReportListTone,
  ScoreMetricItem,
} from "../report-renderer.interface";

/**
 * Concrete Implementor: Markdown profesional (GitHub, Notion, Obsidian, portafolio).
 * Incluye tablas estructuradas, barras de progreso visuales Unicode, bloques ejecutivos
 * y secciones jerárquicas fáciles de leer por cualquier persona.
 */
export class MarkdownRenderer implements IReportRenderer {
  readonly format = "md";
  readonly contentType = "text/markdown; charset=utf-8";
  readonly fileExtension = "md";

  private escapeCell(text: string): string {
    return String(text ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ")
      .trim();
  }

  private buildBar(pct: number): string {
    const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
  }

  private getTierBadge(pct: number): string {
    if (pct >= 80) return "🟢 Destacado";
    if (pct >= 60) return "🟡 Competitivo";
    return "🔴 Prioritario";
  }

  renderTitle(text: string): string {
    const generatedAt = new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `# ${text}\n\n> **DevCareer AI** · Informe Ejecutivo de Evaluación · _Emitido el ${generatedAt}_`;
  }

  renderExecutiveSummary(highlight: ExecutiveHighlight): string {
    const pct =
      highlight.max > 0
        ? Math.max(0, Math.min(100, Math.round((highlight.score / highlight.max) * 100)))
        : 0;
    const statusIcon =
      highlight.status === "high" ? "🟢" : highlight.status === "mid" ? "🟡" : "🔴";
    const badgesLine =
      highlight.badges && highlight.badges.length > 0
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

  renderKeyValueGrid(items: KeyValueItem[]): string {
    const valid = items.filter((item) => item.value && item.value.trim().length > 0);
    if (valid.length === 0) return "";
    const rows = valid
      .map((item) => `| **${this.escapeCell(item.key)}** | ${this.escapeCell(item.value)} |`)
      .join("\n");
    return `| Campo | Detalle |\n| :--- | :--- |\n${rows}`;
  }

  renderChartSummary(title: string, items: ScoreMetricItem[]): string {
    if (!items || items.length === 0) return "";
    const rows = items
      .map((item) => {
        const pct =
          item.max > 0 ? Math.max(0, Math.min(100, Math.round((item.score / item.max) * 100))) : 0;
        const obs = item.comment ? this.escapeCell(item.comment) : "—";
        return `| **${this.escapeCell(item.label)}** | **${item.score}/${item.max}** | ${this.getTierBadge(pct)} | \`${this.buildBar(pct)}\` ${pct}% | ${obs} |`;
      })
      .join("\n");

    return `### ${title}\n\n| Dimensión | Puntaje | Nivel | Progreso (Meta: 80%) | Observación |\n| :--- | :---: | :---: | :--- | :--- |\n${rows}`;
  }

  renderSection(heading: string): string {
    return `---\n\n## ${heading}`;
  }

  renderParagraph(text: string): string {
    if (!text || !text.trim()) return "_Sin observaciones registradas._";
    return `> ${text.trim()}`;
  }

  renderListWithTone(items: string[], tone: ReportListTone): string {
    if (items.length === 0) return "_Sin elementos registrados._";
    if (tone === "action") {
      return items.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    }
    const prefix =
      tone === "positive" ? "- ✅" : tone === "improvement" ? "- 🎯" : "-";
    return items.map((item) => `${prefix} ${item}`).join("\n");
  }

  renderList(items: string[]): string {
    return this.renderListWithTone(items, "neutral");
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
    const base = `- **${label}:** **${score}/${max}** (${this.getTierBadge(pct)} · \`${this.buildBar(pct)}\` ${pct}%)`;
    return comment ? `${base}\n  - _${comment}_` : base;
  }

  renderKeyValue(key: string, value: string): string {
    return `- **${key}:** ${value}`;
  }

  compose(_title: string, blocks: string[]): string {
    const body = blocks.filter(Boolean).join("\n\n");
    return `${body}\n\n---\n\n_Generado por **DevCareer AI** · Plataforma de Preparación Técnica y Empleabilidad con IA._\n`;
  }
}
