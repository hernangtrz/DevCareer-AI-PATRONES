/**
 * Patrón Bridge (Estructural - GoF) — IMPLEMENTOR
 *
 * Define las operaciones primitivas que sabe ejecutar cada formato de salida
 * (HTML/Web imprimible, Markdown, Texto Plano, Excel/CSV).
 * La jerarquía de reportes (Abstracción) NO conoce la sintaxis concreta del formato;
 * solo invoca estas primitivas para mantener ambas jerarquías desacopladas.
 */
export interface KeyValueItem {
    key: string;
    value: string;
}
export interface ScoreMetricItem {
    label: string;
    score: number;
    max: number;
    comment?: string;
}
export interface ExecutiveHighlight {
    score: number;
    max: number;
    verdictLabel: string;
    verdictSummary: string;
    status: "high" | "mid" | "low";
    badges?: string[];
}
export type ReportListTone = "positive" | "improvement" | "action" | "neutral";
export interface IReportRenderer {
    /** Identificador corto del formato (md, html, txt, excel). */
    readonly format: string;
    /** MIME type para la respuesta HTTP. */
    readonly contentType: string;
    /** Extensión del archivo descargable. */
    readonly fileExtension: string;
    renderTitle(text: string): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    /** Primitivas semánticas opcionales para enriquecer reportes ejecutivos y visuales. */
    renderExecutiveSummary?(highlight: ExecutiveHighlight): string;
    renderKeyValueGrid?(items: KeyValueItem[]): string;
    renderChartSummary?(title: string, items: ScoreMetricItem[]): string;
    renderListWithTone?(items: string[], tone: ReportListTone): string;
    /** Une los bloques en el documento final (envoltura del formato). */
    compose(title: string, blocks: string[]): string;
}
