/**
 * Patrón Bridge (Estructural - GoF) — IMPLEMENTOR
 *
 * Define las operaciones primitivas de bajo nivel que sabe hacer un formato de salida.
 * La jerarquía de reportes (Abstracción) NO conoce la sintaxis concreta (Markdown, HTML, texto),
 * solo invoca estas primitivas. Así ambas jerarquías evolucionan de forma independiente.
 */
export interface IReportRenderer {
    /** Identificador corto del formato (md, html, txt). */
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
    /** Une los bloques en el documento final (envoltura del formato). */
    compose(title: string, blocks: string[]): string;
}
