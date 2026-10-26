import { IReportRenderer } from "../report-renderer.interface";

/**
 * Concrete Implementor: Markdown (ideal para GitHub, Notion o README de portafolio).
 */
export class MarkdownRenderer implements IReportRenderer {
  readonly format = "md";
  readonly contentType = "text/markdown; charset=utf-8";
  readonly fileExtension = "md";

  renderTitle(text: string): string {
    return `# ${text}`;
  }

  renderSection(heading: string): string {
    return `## ${heading}`;
  }

  renderParagraph(text: string): string {
    return text;
  }

  renderList(items: string[]): string {
    if (items.length === 0) return "_Sin elementos_";
    return items.map((item) => `- ${item}`).join("\n");
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const line = `- **${label}:** ${score}/${max}`;
    return comment ? `${line} — ${comment}` : line;
  }

  renderKeyValue(key: string, value: string): string {
    return `**${key}:** ${value}`;
  }

  compose(_title: string, blocks: string[]): string {
    return blocks.join("\n\n") + "\n";
  }
}
