"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelRenderer = void 0;
/**
 * Patrón Bridge (Estructural - GoF) — CONCRETE IMPLEMENTOR: ExcelRenderer
 *
 * Renderiza los reportes en formato tabular estructurado (CSV/Excel) compatible
 * con Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Incluye Byte Order Mark (BOM) UTF-8 (\uFEFF) para garantizar que Excel en Windows
 * interprete correctamente los caracteres en español (tildes, eñes) sin problemas de codificación.
 */
class ExcelRenderer {
    constructor() {
        this.format = "excel";
        this.contentType = "text/csv; charset=utf-8";
        this.fileExtension = "csv";
    }
    escape(str) {
        const s = String(str ?? "").replace(/"/g, '""');
        return `"${s}"`;
    }
    renderTitle(text) {
        return `${this.escape("REPORTE")},${this.escape(text)}`;
    }
    renderSection(heading) {
        return `\n${this.escape(">>> " + heading.toUpperCase())},""`;
    }
    renderParagraph(text) {
        return `${this.escape("Detalle")},${this.escape(text)}`;
    }
    renderList(items) {
        if (items.length === 0)
            return `${this.escape("Lista")},${this.escape("(Sin elementos)")}`;
        return items
            .map((item, idx) => `${this.escape(`Elemento ${idx + 1}`)},${this.escape(item)}`)
            .join("\n");
    }
    renderScore(label, score, max, comment) {
        const comm = comment ? ` (${comment})` : "";
        return `${this.escape(label)},${this.escape(`${score}/${max}${comm}`)}`;
    }
    renderKeyValue(key, value) {
        return `${this.escape(key)},${this.escape(value)}`;
    }
    compose(title, blocks) {
        const bom = "\uFEFF";
        const header = `${this.escape("PARÁMETRO / SECCIÓN")},${this.escape("VALOR / DESCRIPCIÓN")}\n`;
        return bom + header + blocks.filter(Boolean).join("\n") + "\n";
    }
}
exports.ExcelRenderer = ExcelRenderer;
//# sourceMappingURL=excel.renderer.js.map