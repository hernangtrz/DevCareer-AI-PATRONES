import {
  ExecutiveHighlight,
  IReportRenderer,
  KeyValueItem,
  ReportListTone,
  ScoreMetricItem,
} from "../report-renderer.interface";

/**
 * Concrete Implementor: Texto plano ejecutivo.
 * Tipografía monoespaciada con alineación estricta de columnas (`padEnd` / `padStart`)
 * y marcos de caracteres box-drawing (`┌`, `─`, `┐`, `│`, `└`, `┘`).
 */
export class PlainTextRenderer implements IReportRenderer {
  readonly format = "txt";
  readonly contentType = "text/plain; charset=utf-8";
  readonly fileExtension = "txt";

  private readonly frameWidth = 78;

  private get innerWidth(): number {
    return this.frameWidth - 4; // "│ " + content + " │"
  }

  private wrapLines(text: string, maxLen: number): string[] {
    const clean = String(text ?? "").replace(/\s+/g, " ").trim();
    if (!clean) return [""];
    const words = clean.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= maxLen) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private frameRow(content: string): string {
    const clipped =
      content.length > this.innerWidth
        ? `${content.slice(0, this.innerWidth - 1)}…`
        : content.padEnd(this.innerWidth, " ");
    return `│ ${clipped} │`;
  }

  private buildBox(rows: string[]): string {
    const border = "─".repeat(this.frameWidth - 2);
    return [`┌${border}┐`, ...rows.map((r) => this.frameRow(r)), `└${border}┘`].join("\n");
  }

  private buildAsciiBar(pct: number): string {
    const total = 18;
    const filled = Math.max(0, Math.min(total, Math.round((pct / 100) * total)));
    return `[${"█".repeat(filled)}${"░".repeat(total - filled)}]`;
  }

  private getTierTag(pct: number): string {
    if (pct >= 80) return "DESTACADO";
    if (pct >= 60) return "COMPETITIVO";
    return "PRIORITARIO";
  }

  renderTitle(text: string): string {
    const upper = text.toUpperCase();
    const generatedAt = new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const titleLines = this.wrapLines(upper, this.innerWidth);
    const underline = "=".repeat(Math.min(this.innerWidth, Math.max(12, upper.length)));

    return this.buildBox([
      "DEVCAREER AI  ·  INFORME EJECUTIVO DE EVALUACIÓN",
      ...titleLines,
      underline,
      `Emitido el: ${generatedAt}`,
    ]);
  }

  renderExecutiveSummary(highlight: ExecutiveHighlight): string {
    const pct =
      highlight.max > 0
        ? Math.max(0, Math.min(100, Math.round((highlight.score / highlight.max) * 100)))
        : 0;

    const scoreStr = `${highlight.score}/${highlight.max} (${String(pct).padStart(3)}%)`;
    const rows: string[] = [
      "RESUMEN EJECUTIVO",
      "─".repeat(this.innerWidth),
      `${"Puntaje Global".padEnd(16)}: ${scoreStr}  ${this.buildAsciiBar(pct)}`,
      `${"Diagnóstico".padEnd(16)}: ${highlight.verdictLabel}`,
    ];

    if (highlight.badges && highlight.badges.length > 0) {
      const badgeLines = this.wrapLines(highlight.badges.join(" · "), this.innerWidth - 18);
      badgeLines.forEach((line, idx) => {
        rows.push(`${(idx === 0 ? "Perfil" : "").padEnd(16)}${idx === 0 ? ": " : "  "}${line}`);
      });
    }

    rows.push("");
    rows.push(...this.wrapLines(highlight.verdictSummary, this.innerWidth));
    return this.buildBox(rows);
  }

  renderKeyValueGrid(items: KeyValueItem[]): string {
    const valid = items.filter((item) => item.value && item.value.trim().length > 0);
    if (valid.length === 0) return "";

    const keyCol = Math.min(24, Math.max(...valid.map((i) => i.key.length)));
    const valWidth = Math.max(20, this.innerWidth - keyCol - 3);
    const rows: string[] = [];

    for (const item of valid) {
      const wrappedVal = this.wrapLines(item.value, valWidth);
      wrappedVal.forEach((line, idx) => {
        const keyCell = idx === 0 ? item.key.padEnd(keyCol) : " ".repeat(keyCol);
        const sep = idx === 0 ? " : " : "   ";
        rows.push(`${keyCell}${sep}${line}`);
      });
    }

    return this.buildBox(rows);
  }

  renderChartSummary(title: string, items: ScoreMetricItem[]): string {
    if (!items || items.length === 0) return "";
    const rows: string[] = [
      title.toUpperCase(),
      "Meta recomendada de industria: 80/100",
      "─".repeat(this.innerWidth),
    ];

    const labelWidth = 28;
    for (const item of items) {
      const pct =
        item.max > 0 ? Math.max(0, Math.min(100, Math.round((item.score / item.max) * 100))) : 0;
      const clippedLabel =
        item.label.length > labelWidth
          ? `${item.label.slice(0, labelWidth - 1)}…`
          : item.label.padEnd(labelWidth);
      const scoreCell = `${item.score}/${item.max}`.padStart(7);
      const tierCell = `[${this.getTierTag(pct)}]`.padEnd(13);

      rows.push(`${clippedLabel} ${this.buildAsciiBar(pct)} ${scoreCell} ${tierCell}`);
      if (item.comment) {
        const commentLines = this.wrapLines(item.comment, this.innerWidth - 4);
        commentLines.forEach((line, idx) => {
          rows.push(`${idx === 0 ? "  └ " : "    "}${line}`);
        });
      }
    }

    return this.buildBox(rows);
  }

  renderSection(heading: string): string {
    const upper = heading.toUpperCase();
    return `${upper}\n${"─".repeat(Math.max(40, Math.min(this.frameWidth, upper.length + 6)))}`;
  }

  renderParagraph(text: string): string {
    if (!text || !text.trim()) return "  (Sin observaciones registradas)";
    return this.buildBox(this.wrapLines(text, this.innerWidth));
  }

  renderListWithTone(items: string[], tone: ReportListTone): string {
    if (items.length === 0) return "  (Sin elementos registrados)";
    return items
      .map((item, idx) => {
        const prefix =
          tone === "positive"
            ? "  [+] "
            : tone === "improvement"
            ? "  [!] "
            : tone === "action"
            ? `  ${String(idx + 1).padStart(2)}. `
            : "  * ";
        const lines = this.wrapLines(item, this.frameWidth - prefix.length);
        return lines
          .map((line, lIdx) => (lIdx === 0 ? `${prefix}${line}` : `${" ".repeat(prefix.length)}${line}`))
          .join("\n");
      })
      .join("\n");
  }

  renderList(items: string[]): string {
    return this.renderListWithTone(items, "neutral");
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
    const scoreCell = `${score}/${max}`.padStart(7);
    const labelCell =
      label.length > 30 ? `${label.slice(0, 29)}…` : label.padEnd(30);
    const line = `  ${labelCell} ${this.buildAsciiBar(pct)} ${scoreCell} [${this.getTierTag(pct)}]`;
    if (!comment) return line;
    const wrapped = this.wrapLines(comment, this.frameWidth - 6)
      .map((l, idx) => (idx === 0 ? `    └ ${l}` : `      ${l}`))
      .join("\n");
    return `${line}\n${wrapped}`;
  }

  renderKeyValue(key: string, value: string): string {
    return `  ${key.padEnd(22)} : ${value}`;
  }

  compose(_title: string, blocks: string[]): string {
    const footerBorder = "─".repeat(this.frameWidth);
    return (
      blocks.filter(Boolean).join("\n\n") +
      `\n\n${footerBorder}\nGenerado por DevCareer AI · Plataforma de Preparación Técnica con IA\n`
    );
  }
}
