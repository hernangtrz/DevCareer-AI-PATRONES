"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_REPORT_FORMATS = void 0;
exports.resolveReportRenderer = resolveReportRenderer;
const markdown_renderer_1 = require("./renderers/markdown.renderer");
const html_renderer_1 = require("./renderers/html.renderer");
const excel_renderer_1 = require("./renderers/excel.renderer");
/**
 * Catálogo / Selector de implementadores disponibles para el Patrón Bridge (GoF).
 * Traduce el parámetro HTTP ?format= al renderer concreto.
 * Soporta HTML, Markdown (.md) y Excel (.csv) como formatos principales.
 */
const renderers = {
    md: () => new markdown_renderer_1.MarkdownRenderer(),
    markdown: () => new markdown_renderer_1.MarkdownRenderer(),
    html: () => new html_renderer_1.HtmlRenderer(),
    excel: () => new excel_renderer_1.ExcelRenderer(),
    csv: () => new excel_renderer_1.ExcelRenderer(),
    xlsx: () => new excel_renderer_1.ExcelRenderer(),
    txt: () => new excel_renderer_1.ExcelRenderer(), // El usuario solicitó reemplazar texto plano por excel
    text: () => new excel_renderer_1.ExcelRenderer(),
};
exports.SUPPORTED_REPORT_FORMATS = ["html", "md", "excel", "txt"];
function resolveReportRenderer(format) {
    const key = (format || "html").toLowerCase();
    const create = renderers[key];
    return create ? create() : null;
}
//# sourceMappingURL=report-renderer.registry.js.map