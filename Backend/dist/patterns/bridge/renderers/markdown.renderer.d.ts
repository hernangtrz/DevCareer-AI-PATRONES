import { IReportRenderer } from "../report-renderer.interface";
/**
 * Concrete Implementor: Markdown (ideal para GitHub, Notion o README de portafolio).
 */
export declare class MarkdownRenderer implements IReportRenderer {
    readonly format = "md";
    readonly contentType = "text/markdown; charset=utf-8";
    readonly fileExtension = "md";
    renderTitle(text: string): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    compose(_title: string, blocks: string[]): string;
}
