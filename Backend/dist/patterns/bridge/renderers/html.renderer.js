"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlRenderer = void 0;
/**
 * Concrete Implementor: HTML (imprimible / guardable como PDF desde el navegador o enviable por correo).
 * Diseño ejecutivo, responsivo, con soporte de modo oscuro y optimizado para impresión (Ctrl+P / PDF).
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
        return `
    <header class="report-header">
      <div class="brand">
        <span class="brand-badge">⚡ DevCareer AI</span>
        <span class="brand-tag">Patrón Bridge • Exportación Oficial</span>
      </div>
      <h1 class="report-title">${this.escape(text)}</h1>
    </header>`;
    }
    renderSection(heading) {
        return `<div class="section-divider"></div><h2 class="section-title"><span>#</span> ${this.escape(heading)}</h2>`;
    }
    renderParagraph(text) {
        return `<div class="callout-box"><p>${this.escape(text)}</p></div>`;
    }
    renderList(items) {
        if (items.length === 0) {
            return `<p class="empty-state"><em>Sin elementos registrados</em></p>`;
        }
        return `
    <ul class="styled-list">
      ${items.map((i) => `<li><span class="bullet">✔</span><span>${this.escape(i)}</span></li>`).join("\n")}
    </ul>`;
    }
    renderScore(label, score, max, comment) {
        const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
        const scoreColorClass = pct >= 80 ? "score-high" : pct >= 60 ? "score-mid" : "score-low";
        return `
    <div class="score-card ${scoreColorClass}">
      <div class="score-header">
        <span class="score-label">${this.escape(label)}</span>
        <div class="score-badge">
          <strong>${score}/${max}</strong>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      ${comment ? `<p class="score-comment">${this.escape(comment)}</p>` : ""}
    </div>`;
    }
    renderKeyValue(key, value) {
        return `
    <div class="meta-row">
      <span class="meta-key">${this.escape(key)}</span>
      <span class="meta-value">${this.escape(value)}</span>
    </div>`;
    }
    compose(title, blocks) {
        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${this.escape(title)}</title>
<style>
  :root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --primary-light: #e0e7ff;
    --bg-page: #f8fafc;
    --bg-card: #ffffff;
    --bg-inner: #f1f5f9;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.03);
    --radius: 14px;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page: #090d16;
      --bg-card: #111827;
      --bg-inner: #1f2937;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: #1f293d;
      --primary-light: #1e1b4b;
      --shadow: 0 12px 30px -8px rgba(0,0,0,0.4);
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font);
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.6;
    padding: 32px 16px;
    display: flex;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }

  .report-container {
    width: 100%;
    max-width: 860px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 44px 48px;
    box-shadow: var(--shadow);
  }

  /* Header */
  .report-header {
    border-bottom: 2px solid var(--border);
    padding-bottom: 24px;
    margin-bottom: 24px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .brand-badge {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 9999px;
  }
  .brand-tag {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .report-title {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--text-main) 40%, var(--primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.25;
  }

  /* Metadata */
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: var(--bg-inner);
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .meta-key { font-weight: 600; color: var(--text-muted); }
  .meta-value { font-weight: 700; color: var(--text-main); font-family: monospace; }

  /* Sections */
  .section-divider {
    height: 1px;
    background: var(--border);
    margin: 28px 0 18px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title span {
    color: var(--primary);
    font-weight: 900;
  }

  /* Score Cards */
  .score-card {
    background: var(--bg-inner);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    transition: transform 0.15s ease;
  }
  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .score-label {
    font-weight: 600;
    font-size: 15px;
    color: var(--text-main);
  }
  .score-badge {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-main);
  }
  .score-max {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }
  .progress-track {
    width: 100%;
    height: 9px;
    background: var(--border);
    border-radius: 9999px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
    transition: width 0.4s ease;
  }
  .score-high .progress-fill { background: linear-gradient(90deg, #10b981, #34d399); }
  .score-mid .progress-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .score-low .progress-fill { background: linear-gradient(90deg, #ef4444, #f87171); }

  .score-comment {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 8px;
    line-height: 1.5;
  }

  /* Lists */
  .styled-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }
  .styled-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14.5px;
    background: var(--bg-inner);
    border: 1px solid var(--border);
    padding: 12px 16px;
    border-radius: 10px;
  }
  .bullet {
    color: #10b981;
    font-weight: 800;
    flex-shrink: 0;
  }

  /* Callout / Paragraphs */
  .callout-box {
    background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06));
    border-left: 4px solid var(--primary);
    padding: 16px 20px;
    border-radius: 0 10px 10px 0;
    margin: 12px 0;
    font-size: 15px;
    line-height: 1.65;
  }
  .empty-state {
    color: var(--text-muted);
    font-size: 14px;
    font-style: italic;
  }

  /* Footer */
  .report-footer {
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-muted);
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Print Styles */
  @media print {
    body { background: #ffffff !important; color: #000000 !important; padding: 0; }
    .report-container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
    .score-card, .styled-list li, .meta-row { break-inside: avoid; }
  }
</style>
</head>
<body>
  <main class="report-container">
    ${blocks.join("\n")}
    <footer class="report-footer">
      <span>Generado por DevCareer AI • Preparación Técnica Profesional</span>
      <span>Patrón de Diseño Bridge (GoF)</span>
    </footer>
  </main>
</body>
</html>
`;
    }
}
exports.HtmlRenderer = HtmlRenderer;
//# sourceMappingURL=html.renderer.js.map