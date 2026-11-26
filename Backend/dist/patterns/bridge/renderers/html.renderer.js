"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlRenderer = void 0;
const DEVCAREER_LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="dcLogoGrad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#CAC5FE"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="dcLogoGrad2" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DDDFFF"/>
      <stop offset="100%" stop-color="#CAC5FE"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="38" height="38" rx="11" fill="#13162a" stroke="rgba(165,180,252,0.35)" stroke-width="1.2"/>
  <path d="M14 9 L7 14.5 L7 16.5 L14 22" stroke="url(#dcLogoGrad1)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M26 9 L33 14.5 L33 16.5 L26 22" stroke="url(#dcLogoGrad1)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="20" cy="15.5" r="3.4" fill="url(#dcLogoGrad2)"/>
  <line x1="20" y1="19" x2="20" y2="25" stroke="url(#dcLogoGrad1)" stroke-width="2" stroke-linecap="round"/>
  <path d="M12 28 Q16 24.5 20 27.5 Q24 30.5 28 28" stroke="url(#dcLogoGrad2)" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M9.5 31.2 Q14.8 26 20 30.2 Q25.2 34.4 30.5 31.2" stroke="url(#dcLogoGrad1)" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.65"/>
</svg>`;
/**
 * Concrete Implementor: HTML ejecutivo (Web & PDF imprimible).
 * Incluye logotipo oficial de DevCareer AI, medidor circular SVG, gráfico radar
 * y barras comparativas contra meta de industria, tarjetas semánticas y soporte
 * completo de impresión / PDF sin dependencias externas.
 */
class HtmlRenderer {
    constructor() {
        this.format = "html";
        this.contentType = "text/html; charset=utf-8";
        this.fileExtension = "html";
    }
    escape(text) {
        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    getScoreTone(pct) {
        if (pct >= 80)
            return { cls: "score-high", label: "Destacado", color: "#10b981" };
        if (pct >= 60)
            return { cls: "score-mid", label: "Competitivo", color: "#f59e0b" };
        return { cls: "score-low", label: "Prioritario", color: "#ef4444" };
    }
    buildRadarSvg(items) {
        const count = items.length;
        if (count < 3)
            return "";
        const cx = 170;
        const cy = 148;
        const maxR = 94;
        const rings = [25, 50, 75, 100];
        const pointAt = (index, pct) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
            const r = (Math.max(0, Math.min(100, pct)) / 100) * maxR;
            return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
        };
        const gridPolygons = rings
            .map((ring) => {
            const pts = items
                .map((_, idx) => pointAt(idx, ring).map((n) => n.toFixed(1)).join(","))
                .join(" ");
            return `<polygon points="${pts}" fill="none" stroke="var(--chart-grid)" stroke-width="1" />`;
        })
            .join("");
        const benchmarkPts = items
            .map((_, idx) => pointAt(idx, 80).map((n) => n.toFixed(1)).join(","))
            .join(" ");
        const axes = items
            .map((_, idx) => {
            const [x, y] = pointAt(idx, 100);
            return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--chart-grid)" stroke-width="1" />`;
        })
            .join("");
        const dataPoints = items.map((item, idx) => {
            const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
            return { point: pointAt(idx, pct), pct, item };
        });
        const dataPolygonPts = dataPoints
            .map(({ point }) => point.map((n) => n.toFixed(1)).join(","))
            .join(" ");
        const nodes = dataPoints
            .map(({ point }) => {
            const [x, y] = point;
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#818cf8" stroke="#ffffff" stroke-width="2" />`;
        })
            .join("");
        const labels = items
            .map((item, idx) => {
            const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / count;
            const labelR = maxR + 22;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
            const shortName = item.label.length > 22 ? `${item.label.slice(0, 20).trim()}…` : item.label;
            const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
            return `<text x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" text-anchor="${anchor}" class="radar-label">${this.escape(shortName)}</text>
                <text x="${lx.toFixed(1)}" y="${(ly + 11).toFixed(1)}" text-anchor="${anchor}" class="radar-val">${pct}%</text>`;
        })
            .join("");
        return `
      <div class="radar-panel">
        <div class="chart-subtitle">Mapa de Equilibrio vs. Estándar (80%)</div>
        <svg viewBox="0 0 340 296" class="radar-svg" role="img" aria-label="Gráfico radar de competencias evaluadas">
          <defs>
            <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.42" />
              <stop offset="100%" stop-color="#a855f7" stop-opacity="0.22" />
            </linearGradient>
          </defs>
          ${gridPolygons}
          ${axes}
          <polygon points="${benchmarkPts}" fill="none" stroke="#10b981" stroke-width="1.4" stroke-dasharray="4 4" opacity="0.7" />
          <polygon points="${dataPolygonPts}" fill="url(#radarFillGrad)" stroke="#818cf8" stroke-width="2.4" stroke-linejoin="round" />
          ${nodes}
          ${labels}
        </svg>
        <div class="chart-legend">
          <span><i class="legend-dot legend-dot-candidate"></i> Tu resultado</span>
          <span><i class="legend-dot legend-dot-benchmark"></i> Meta recomendada (80/100)</span>
        </div>
      </div>`;
    }
    renderTitle(text) {
        const generatedAt = new Date().toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        return `
    <header class="report-header">
      <div class="brand-bar">
        <div class="brand-identity">
          <div class="brand-logo">${DEVCAREER_LOGO_SVG}</div>
          <div>
            <div class="brand-name">DevCareer AI</div>
            <div class="brand-sub">Informe Ejecutivo de Evaluación Profesional</div>
          </div>
        </div>
        <div class="header-actions no-print">
          <button type="button" class="action-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
        </div>
      </div>
      <div class="title-block">
        <h1 class="report-title">${this.escape(text)}</h1>
        <p class="report-date">Emitido el ${this.escape(generatedAt)}</p>
      </div>
    </header>`;
    }
    renderExecutiveSummary(highlight) {
        const pct = highlight.max > 0
            ? Math.max(0, Math.min(100, Math.round((highlight.score / highlight.max) * 100)))
            : 0;
        const radius = 56;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference * (1 - pct / 100);
        const strokeColor = highlight.status === "high"
            ? "#10b981"
            : highlight.status === "mid"
                ? "#f59e0b"
                : "#ef4444";
        const badgesHtml = highlight.badges && highlight.badges.length > 0
            ? `<div class="exec-badges">${highlight.badges
                .map((b) => `<span class="exec-badge">${this.escape(b)}</span>`)
                .join("")}</div>`
            : "";
        return `
    <section class="exec-hero status-${highlight.status}">
      <div class="gauge-wrap">
        <svg width="144" height="144" viewBox="0 0 144 144" role="img" aria-label="Puntaje global ${highlight.score} de ${highlight.max}">
          <circle cx="72" cy="72" r="${radius}" fill="none" stroke="var(--gauge-track)" stroke-width="11" />
          <circle
            cx="72"
            cy="72"
            r="${radius}"
            fill="none"
            stroke="${strokeColor}"
            stroke-width="11"
            stroke-linecap="round"
            stroke-dasharray="${circumference.toFixed(1)}"
            stroke-dashoffset="${dashOffset.toFixed(1)}"
            transform="rotate(-90 72 72)"
          />
        </svg>
        <div class="gauge-center">
          <div class="gauge-score">${highlight.score}/${highlight.max}</div>
          <div class="gauge-caption">Puntaje global</div>
        </div>
      </div>
      <div class="exec-copy">
        <span class="verdict-pill pill-${highlight.status}">${this.escape(highlight.verdictLabel)}</span>
        <h2 class="exec-heading">Resumen Ejecutivo del Desempeño</h2>
        <p class="exec-summary">${this.escape(highlight.verdictSummary)}</p>
        ${badgesHtml}
      </div>
    </section>`;
    }
    renderKeyValueGrid(items) {
        const valid = items.filter((item) => item.value && item.value.trim().length > 0);
        if (valid.length === 0)
            return "";
        return `
    <div class="meta-grid">
      ${valid
            .map((item) => `
      <div class="meta-card">
        <span class="meta-card-key">${this.escape(item.key)}</span>
        <span class="meta-card-value">${this.escape(item.value)}</span>
      </div>`)
            .join("")}
    </div>`;
    }
    renderChartSummary(title, items) {
        if (!items || items.length === 0)
            return "";
        const radarHtml = items.length >= 3 ? this.buildRadarSvg(items) : "";
        const barsHtml = items
            .map((item) => {
            const pct = item.max > 0 ? Math.max(0, Math.min(100, Math.round((item.score / item.max) * 100))) : 0;
            const tone = this.getScoreTone(pct);
            return `
        <div class="bar-row">
          <div class="bar-row-top">
            <span class="bar-row-label">${this.escape(item.label)}</span>
            <span class="bar-row-metric">
              <span class="mini-pill ${tone.cls}">${tone.label}</span>
              <strong>${item.score}/${item.max}</strong>
            </span>
          </div>
          <div class="bar-track-bench">
            <div class="bar-fill ${tone.cls}" style="width: ${pct}%"></div>
            <div class="bench-marker" style="left: 80%" title="Meta recomendada: 80%"></div>
          </div>
        </div>`;
        })
            .join("");
        return `
    <section class="visual-summary-card">
      <div class="visual-summary-head">
        <h3>${this.escape(title)}</h3>
        <span class="bench-note">Línea vertical = estándar recomendado (80/100)</span>
      </div>
      <div class="visual-summary-grid ${items.length >= 3 ? "has-radar" : ""}">
        ${radarHtml}
        <div class="bars-panel">
          <div class="chart-subtitle">Comparativa por Dimensión</div>
          <div class="bars-stack">${barsHtml}</div>
        </div>
      </div>
    </section>`;
    }
    renderSection(heading) {
        return `
    <div class="section-heading">
      <span class="section-accent" aria-hidden="true"></span>
      <h2>${this.escape(heading)}</h2>
    </div>`;
    }
    renderParagraph(text) {
        if (!text || !text.trim()) {
            return `<p class="empty-state">Sin observaciones registradas en esta sección.</p>`;
        }
        return `<div class="callout-box"><p>${this.escape(text)}</p></div>`;
    }
    renderListWithTone(items, tone) {
        if (items.length === 0) {
            return `<p class="empty-state">Sin elementos registrados en esta categoría.</p>`;
        }
        const iconFor = (idx) => {
            if (tone === "positive")
                return "✓";
            if (tone === "improvement")
                return "!";
            if (tone === "action")
                return String(idx + 1);
            return "•";
        };
        return `
    <ul class="styled-list list-${tone}">
      ${items
            .map((item, idx) => `<li><span class="list-marker marker-${tone}">${iconFor(idx)}</span><span class="list-text">${this.escape(item)}</span></li>`)
            .join("\n")}
    </ul>`;
    }
    renderList(items) {
        return this.renderListWithTone(items, "neutral");
    }
    renderScore(label, score, max, comment) {
        const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
        const tone = this.getScoreTone(pct);
        return `
    <div class="score-card ${tone.cls}">
      <div class="score-header">
        <div class="score-title-group">
          <span class="score-label">${this.escape(label)}</span>
          <span class="mini-pill ${tone.cls}">${tone.label}</span>
        </div>
        <div class="score-badge">
          <strong>${score}/${max}</strong>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
        <div class="bench-marker" style="left: 80%"></div>
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
        const year = new Date().getFullYear();
        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${this.escape(title)}</title>
<style>
  :root {
    --primary: #4f46e5;
    --primary-soft: #818cf8;
    --accent: #9333ea;
    --bg-page: #f1f5f9;
    --bg-card: #ffffff;
    --bg-inner: #f8fafc;
    --text-main: #0f172a;
    --text-body: #334155;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --gauge-track: #e2e8f0;
    --chart-grid: #cbd5e1;
    --shadow: 0 20px 45px -18px rgba(15, 23, 42, 0.14);
    --font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page: #05070e;
      --bg-card: #0e111d;
      --bg-inner: #15192a;
      --text-main: #f8fafc;
      --text-body: #cbd5e1;
      --text-muted: #94a3b8;
      --border: #23283d;
      --gauge-track: #1e2438;
      --chart-grid: #2b334f;
      --shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.65);
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font);
    background: var(--bg-page);
    color: var(--text-main);
    line-height: 1.6;
    padding: 28px 16px 48px;
    display: flex;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }

  .report-container {
    width: 100%;
    max-width: 920px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 36px 42px 34px;
    box-shadow: var(--shadow);
  }

  /* Header */
  .report-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 22px;
    margin-bottom: 24px;
  }
  .brand-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .brand-identity {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brand-name {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-main);
  }
  .brand-sub {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .action-btn {
    appearance: none;
    border: 1px solid rgba(99, 102, 241, 0.35);
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    padding: 9px 16px;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 6px 16px -6px rgba(79, 70, 229, 0.55);
  }
  .action-btn:hover { opacity: 0.92; }
  .report-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-main);
    line-height: 1.25;
  }
  .report-date {
    margin-top: 6px;
    font-size: 12.5px;
    color: var(--text-muted);
  }

  /* Executive Hero */
  .exec-hero {
    display: grid;
    grid-template-columns: 156px 1fr;
    gap: 24px;
    align-items: center;
    padding: 22px 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(147, 51, 234, 0.05));
    border: 1px solid rgba(99, 102, 241, 0.24);
    margin-bottom: 20px;
  }
  .gauge-wrap {
    position: relative;
    width: 144px;
    height: 144px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  .gauge-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .gauge-score {
    font-size: 23px;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.1;
  }
  .gauge-caption {
    font-size: 10.5px;
    color: var(--text-muted);
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .verdict-pill {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 11px;
    border-radius: 9999px;
    margin-bottom: 8px;
  }
  .pill-high { background: rgba(16, 185, 129, 0.16); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); }
  .pill-mid { background: rgba(245, 158, 11, 0.16); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35); }
  .pill-low { background: rgba(239, 68, 68, 0.14); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); }
  .exec-heading {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 6px;
  }
  .exec-summary {
    font-size: 14px;
    color: var(--text-body);
    line-height: 1.6;
  }
  .exec-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .exec-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 9999px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-body);
  }

  /* Metadata Grid */
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
    gap: 10px;
    margin-bottom: 22px;
  }
  .meta-card {
    background: var(--bg-inner);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 11px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .meta-card-key {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .meta-card-value {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-main);
    word-break: break-word;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: var(--bg-inner);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 8px;
    font-size: 13.5px;
  }
  .meta-key { font-weight: 600; color: var(--text-muted); }
  .meta-value { font-weight: 700; color: var(--text-main); }

  /* Visual Chart Card */
  .visual-summary-card {
    background: var(--bg-inner);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px 22px;
    margin: 22px 0;
    break-inside: avoid;
  }
  .visual-summary-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .visual-summary-head h3 {
    font-size: 15.5px;
    font-weight: 700;
    color: var(--text-main);
  }
  .bench-note {
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .visual-summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-items: center;
  }
  .visual-summary-grid.has-radar {
    grid-template-columns: minmax(250px, 320px) 1fr;
  }
  .chart-subtitle {
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .radar-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .radar-svg {
    width: 100%;
    max-width: 315px;
    height: auto;
    overflow: visible;
  }
  .radar-label {
    font-size: 9.5px;
    font-weight: 600;
    fill: var(--text-body);
  }
  .radar-val {
    font-size: 9.5px;
    font-weight: 800;
    fill: var(--primary-soft);
  }
  .chart-legend {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .legend-dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 9999px;
    margin-right: 5px;
    vertical-align: middle;
  }
  .legend-dot-candidate { background: #818cf8; }
  .legend-dot-benchmark { background: #10b981; }

  .bars-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bar-row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 13px;
  }
  .bar-row-label { font-weight: 600; color: var(--text-main); }
  .bar-row-metric { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
  .bar-track-bench {
    position: relative;
    width: 100%;
    height: 9px;
    border-radius: 9999px;
    background: var(--border);
    overflow: visible;
  }
  .bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #4f46e5, #818cf8);
  }
  .bar-fill.score-high { background: linear-gradient(90deg, #059669, #34d399); }
  .bar-fill.score-mid { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .bar-fill.score-low { background: linear-gradient(90deg, #dc2626, #f87171); }
  .bench-marker {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background: #10b981;
    border-radius: 2px;
    opacity: 0.85;
  }

  /* Sections */
  .section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 28px 0 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .section-accent {
    width: 4px;
    height: 20px;
    border-radius: 9999px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    flex-shrink: 0;
  }
  .section-heading h2 {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-main);
  }

  /* Detailed Score Cards */
  .score-card {
    background: var(--bg-inner);
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 15px 18px;
    margin-bottom: 11px;
    break-inside: avoid;
  }
  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 9px;
  }
  .score-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .score-label { font-weight: 700; font-size: 14.5px; color: var(--text-main); }
  .score-badge { font-size: 16px; font-weight: 800; color: var(--text-main); white-space: nowrap; }
  .mini-pill {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
  }
  .mini-pill.score-high { background: rgba(16, 185, 129, 0.14); color: #10b981; }
  .mini-pill.score-mid { background: rgba(245, 158, 11, 0.15); color: #d97706; }
  .mini-pill.score-low { background: rgba(239, 68, 68, 0.14); color: #ef4444; }
  .progress-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: var(--border);
    border-radius: 9999px;
  }
  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
  }
  .score-high .progress-fill { background: linear-gradient(90deg, #059669, #34d399); }
  .score-mid .progress-fill { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .score-low .progress-fill { background: linear-gradient(90deg, #dc2626, #f87171); }
  .score-comment {
    font-size: 13.5px;
    color: var(--text-body);
    margin-top: 9px;
    line-height: 1.55;
  }

  /* Semantic Lists */
  .styled-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-bottom: 14px;
  }
  .styled-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
    color: var(--text-body);
    background: var(--bg-inner);
    border: 1px solid var(--border);
    padding: 12px 15px;
    border-radius: 12px;
    break-inside: avoid;
  }
  .list-positive li { border-left: 3px solid #10b981; }
  .list-improvement li { border-left: 3px solid #f59e0b; }
  .list-action li { border-left: 3px solid #6366f1; }
  .list-marker {
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .marker-positive { background: rgba(16, 185, 129, 0.16); color: #10b981; }
  .marker-improvement { background: rgba(245, 158, 11, 0.18); color: #d97706; }
  .marker-action { background: rgba(99, 102, 241, 0.18); color: #6366f1; }
  .marker-neutral { background: rgba(148, 163, 184, 0.18); color: var(--text-muted); }
  .list-text { line-height: 1.55; }

  /* Callout */
  .callout-box {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(147, 51, 234, 0.06));
    border: 1px solid rgba(99, 102, 241, 0.22);
    border-left: 4px solid var(--primary);
    padding: 16px 20px;
    border-radius: 12px;
    margin: 10px 0 14px;
    font-size: 14.5px;
    color: var(--text-body);
    line-height: 1.68;
    break-inside: avoid;
  }
  .empty-state {
    color: var(--text-muted);
    font-size: 13.5px;
    font-style: italic;
    padding: 6px 2px;
  }

  /* Footer */
  .report-footer {
    margin-top: 34px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-muted);
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 720px) {
    .report-container { padding: 24px 18px; }
    .exec-hero { grid-template-columns: 1fr; text-align: center; }
    .exec-badges { justify-content: center; }
    .visual-summary-grid.has-radar { grid-template-columns: 1fr; }
  }

  @media print {
    :root {
      --bg-page: #ffffff;
      --bg-card: #ffffff;
      --bg-inner: #f8fafc;
      --text-main: #0f172a;
      --text-body: #334155;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --gauge-track: #e2e8f0;
      --chart-grid: #cbd5e1;
    }
    @page { size: A4 portrait; margin: 12mm; }
    body { background: #ffffff !important; padding: 0 !important; }
    .no-print { display: none !important; }
    .report-container {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
</head>
<body>
  <main class="report-container">
    ${blocks.filter(Boolean).join("\n")}
    <footer class="report-footer">
      <span><strong>DevCareer AI</strong> · Informe Confidencial de Preparación Profesional</span>
      <span>© ${year} DevCareer AI</span>
    </footer>
  </main>
</body>
</html>
`;
    }
}
exports.HtmlRenderer = HtmlRenderer;
//# sourceMappingURL=html.renderer.js.map