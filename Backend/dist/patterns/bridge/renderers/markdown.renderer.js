"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = void 0;
/**
 * Concrete Implementor: Markdown (ideal para GitHub, Notion o README de portafolio).
 */
class MarkdownRenderer {
    constructor() {
        this.format = "md";
        this.contentType = "text/markdown; charset=utf-8";
        this.fileExtension = "md";
    }
    renderTitle(text) {
        return `# ${text}`;
    }
    renderSection(heading) {
        return `## ${heading}`;
    }
    renderParagraph(text) {
        return text;
    }
    renderList(items) {
        if (items.length === 0)
            return "_Sin elementos_";
        return items.map((item) => `- ${item}`).join("\n");
    }
    renderScore(label, score, max, comment) {
        const line = `- **${label}:** ${score}/${max}`;
        return comment ? `${line} — ${comment}` : line;
    }
    renderKeyValue(key, value) {
        return `**${key}:** ${value}`;
    }
    compose(_title, blocks) {
        return blocks.join("\n\n") + "\n";
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
//# sourceMappingURL=markdown.renderer.js.map