"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_REPORT_FORMATS = void 0;
exports.resolveReportRenderer = resolveReportRenderer;
const markdown_renderer_1 = require("./renderers/markdown.renderer");
const html_renderer_1 = require("./renderers/html.renderer");
const plain_text_renderer_1 = require("./renderers/plain-text.renderer");
/**
 * Catálogo simple de implementadores disponibles para el Bridge.
 * Traduce el parámetro HTTP `?format=` al renderer concreto.
 * Agregar un formato nuevo = crear la clase y registrarla aquí (los reportes no cambian).
 */
const renderers = {
    md: () => new markdown_renderer_1.MarkdownRenderer(),
    markdown: () => new markdown_renderer_1.MarkdownRenderer(),
    html: () => new html_renderer_1.HtmlRenderer(),
    txt: () => new plain_text_renderer_1.PlainTextRenderer(),
    text: () => new plain_text_renderer_1.PlainTextRenderer(),
};
exports.SUPPORTED_REPORT_FORMATS = ["md", "html", "txt"];
function resolveReportRenderer(format) {
    const key = (format || "md").toLowerCase();
    const create = renderers[key];
    return create ? create() : null;
}
//# sourceMappingURL=report-renderer.registry.js.map