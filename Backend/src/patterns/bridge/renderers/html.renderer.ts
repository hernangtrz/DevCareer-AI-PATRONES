import { IReportRenderer } from "../report-renderer.interface";

/**
 * Concrete Implementor: HTML (imprimible / guardable como PDF desde el navegador o enviable por correo).
 */
export class HtmlRenderer implements IReportRenderer {
  readonly format = "html";
  readonly contentType = "text/html; charset=utf-8";
  readonly fileExtension = "html";

  private escape(text: string): string {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  renderTitle(text: string): string {
    return `<h1>${this.escape(text)}</h1>`;
  }

  renderSection(heading: string): string {
    return `<h2>${this.escape(heading)}</h2>`;
  }

  renderParagraph(text: string): string {
    return `<p>${this.escape(text)}</p>`;
  }

  renderList(items: string[]): string {
    if (items.length === 0) return "<p><em>Sin elementos</em></p>";
    return `<ul>${items.map((i) => `<li>${this.escape(i)}</li>`).join("")}</ul>`;
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
    return (
      `<div class="score"><strong>${this.escape(label)}</strong> <span>${score}/${max}</span>` +
      `<div class="bar"><div style="width:${pct}%"></div></div>` +
      (comment ? `<small>${this.escape(comment)}</small>` : "") +
      `</div>`
    );
  }

  renderKeyValue(key: string, value: string): string {
    return `<p><strong>${this.escape(key)}:</strong> ${this.escape(value)}</p>`;
  }

  compose(title: string, blocks: string[]): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${this.escape(title)}</title>
<style>
  body { font-family: Inter, Arial, sans-serif; max-width: 820px; margin: 40px auto; color: #1f2937; line-height: 1.5; }
  h1 { color: #4f46e5; } h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .score { margin: 10px 0; } .score span { float: right; }
  .bar { background: #e5e7eb; border-radius: 6px; height: 8px; margin: 4px 0; }
  .bar div { background: linear-gradient(90deg, #6366f1, #22d3ee); height: 8px; border-radius: 6px; }
  small { color: #6b7280; }
</style>
</head>
<body>
${blocks.join("\n")}
</body>
</html>
`;
  }
}
