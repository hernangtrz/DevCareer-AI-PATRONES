import { IReportRenderer } from "../report-renderer.interface";
/**
 * Concrete Implementor: HTML (imprimible / guardable como PDF desde el navegador o enviable por correo).
 */
export declare class HtmlRenderer implements IReportRenderer {
    readonly format = "html";
    readonly contentType = "text/html; charset=utf-8";
    readonly fileExtension = "html";
    private escape;
    renderTitle(text: string): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    compose(title: string, blocks: string[]): string;
}
