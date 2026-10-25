import { IReportRenderer } from "../report-renderer.interface";

/**
 * Concrete Implementor: Texto plano (copiar/pegar en chats, correos simples o terminal).
 */
export class PlainTextRenderer implements IReportRenderer {
  readonly format = "txt";
  readonly contentType = "text/plain; charset=utf-8";
  readonly fileExtension = "txt";

  renderTitle(text: string): string {
    const upper = text.toUpperCase();
    return `${upper}\n${"=".repeat(upper.length)}`;
  }

  renderSection(heading: string): string {
    return `${heading}\n${"-".repeat(heading.length)}`;
  }

  renderParagraph(text: string): string {
    return text;
  }

  renderList(items: string[]): string {
    if (items.length === 0) return "(Sin elementos)";
    return items.map((item) => `  * ${item}`).join("\n");
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const line = `  ${label}: ${score}/${max}`;
    return comment ? `${line}\n    > ${comment}` : line;
  }

  renderKeyValue(key: string, value: string): string {
    return `${key}: ${value}`;
  }

  compose(_title: string, blocks: string[]): string {
    return blocks.join("\n\n") + "\n";
  }
}
