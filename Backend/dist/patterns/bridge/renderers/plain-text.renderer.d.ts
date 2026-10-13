import { IReportRenderer } from "../report-renderer.interface";
/**
 * Concrete Implementor: Texto plano (copiar/pegar en chats, correos simples o terminal).
 */
export declare class PlainTextRenderer implements IReportRenderer {
    readonly format = "txt";
    readonly contentType = "text/plain; charset=utf-8";
    readonly fileExtension = "txt";
    renderTitle(text: string): string;
    renderSection(heading: string): string;
    renderParagraph(text: string): string;
    renderList(items: string[]): string;
    renderScore(label: string, score: number, max: number, comment?: string): string;
    renderKeyValue(key: string, value: string): string;
    compose(_title: string, blocks: string[]): string;
}
