import { ExecutiveHighlight, IReportRenderer, KeyValueItem, ReportListTone, ScoreMetricItem } from "../report-renderer.interface";
/**
 * Concrete Implementor: HTML ejecutivo (Web & PDF imprimible).
 * Incluye logotipo oficial de DevCareer AI, medidor circular SVG, gráfico radar
 * y barras comparativas contra meta de industria, tarjetas semánticas y soporte
 * completo de impresión / PDF sin dependencias externas.
 */
export declare class HtmlRenderer implements IReportRenderer {
    readonly format = "html";
    readonly contentType = "text/html; charset=utf-8";
    readonly fileExtension = "html";
    private escape;
    private getScoreTone;
    private buildRadarSvg;
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
    compose(title: string, blocks: string[]): string;
}
