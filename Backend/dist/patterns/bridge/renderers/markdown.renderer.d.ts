import { ExecutiveHighlight, IReportRenderer, KeyValueItem, ReportListTone, ScoreMetricItem } from "../report-renderer.interface";
/**
 * Concrete Implementor: Markdown profesional (GitHub, Notion, Obsidian, portafolio).
 * Incluye tablas estructuradas, barras de progreso visuales Unicode, bloques ejecutivos
 * y secciones jerárquicas fáciles de leer por cualquier persona.
 */
export declare class MarkdownRenderer implements IReportRenderer {
    readonly format = "md";
    readonly contentType = "text/markdown; charset=utf-8";
    readonly fileExtension = "md";
    private escapeCell;
    private buildBar;
    private getTierBadge;
    renderTitle(text: string): string;
    renderExecutiveSummary(highlight: ExecutiveHighlight): string;
    renderKeyValueGrid(items: KeyValueItem[]): string;
    renderChartSummary(title: string, items: ScoreMetricItem[]): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderListWithTone(items: string[], tone: ReportListTone): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    compose(_title: string, blocks: string[]): string;
}
