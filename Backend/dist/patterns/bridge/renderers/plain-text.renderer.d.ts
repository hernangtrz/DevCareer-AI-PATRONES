import { ExecutiveHighlight, IReportRenderer, KeyValueItem, ReportListTone, ScoreMetricItem } from "../report-renderer.interface";
/**
 * Concrete Implementor: Texto plano ejecutivo.
 * Tipografía monoespaciada con alineación estricta de columnas (`padEnd` / `padStart`)
 * y marcos de caracteres box-drawing (`┌`, `─`, `┐`, `│`, `└`, `┘`).
 */
export declare class PlainTextRenderer implements IReportRenderer {
    readonly format = "txt";
    readonly contentType = "text/plain; charset=utf-8";
    readonly fileExtension = "txt";
    private readonly frameWidth;
    private get innerWidth();
    private wrapLines;
    private frameRow;
    private buildBox;
    private buildAsciiBar;
    private getTierTag;
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
