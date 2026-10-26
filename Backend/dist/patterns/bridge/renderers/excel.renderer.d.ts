import { IReportRenderer } from "../report-renderer.interface";
/**
 * Patrón Bridge (Estructural - GoF) — CONCRETE IMPLEMENTOR: ExcelRenderer
 *
 * Renderiza los reportes en formato tabular estructurado (CSV/Excel) compatible
 * con Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Incluye Byte Order Mark (BOM) UTF-8 (\uFEFF) para garantizar que Excel en Windows
 * interprete correctamente los caracteres en español (tildes, eñes) sin problemas de codificación.
 */
export declare class ExcelRenderer implements IReportRenderer {
    readonly format = "excel";
    readonly contentType = "text/csv; charset=utf-8";
    readonly fileExtension = "csv";
    private escape;
    renderTitle(text: string): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    compose(title: string, blocks: string[]): string;
}
