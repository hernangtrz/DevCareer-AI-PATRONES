"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlRenderer = void 0;
/**
 * Concrete Implementor: HTML (imprimible / guardable como PDF desde el navegador o enviable por correo).
 */
class HtmlRenderer {
    constructor() {
        this.format = "html";
        this.contentType = "text/html; charset=utf-8";
        this.fileExtension = "html";
    }
    escape(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    renderTitle(text) {
        return `<h1>${this.escape(text)}</h1>`;
    }
    renderSection(heading) {
        return `<h2>${this.escape(heading)}</h2>`;
    }
    renderParagraph(text) {
        return `<p>${this.escape(text)}</p>`;
    }
    renderList(items) {
        if (items.length === 0)
            return "<p><em>Sin elementos</em></p>";
        return `<ul>${items.map((i) => `<li>${this.escape(i)}</li>`).join("")}</ul>`;
    }
    renderScore(label, score, max, comment) {
        const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
        return (`<div class="score"><strong>${this.escape(label)}</strong> <span>${score}/${max}</span>` +
            `<div class="bar"><div style="width:${pct}%"></div></div>` +
            (comment ? `<small>${this.escape(comment)}</small>` : "") +
            `</div>`);
    }
    renderKeyValue(key, value) {
        return `<p><strong>${this.escape(key)}:</strong> ${this.escape(value)}</p>`;
    }
    compose(title, blocks) {
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
exports.HtmlRenderer = HtmlRenderer;
//# sourceMappingURL=html.renderer.js.map