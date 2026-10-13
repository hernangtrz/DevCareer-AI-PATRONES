"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlainTextRenderer = void 0;
/**
 * Concrete Implementor: Texto plano (copiar/pegar en chats, correos simples o terminal).
 */
class PlainTextRenderer {
    constructor() {
        this.format = "txt";
        this.contentType = "text/plain; charset=utf-8";
        this.fileExtension = "txt";
    }
    renderTitle(text) {
        const upper = text.toUpperCase();
        return `${upper}\n${"=".repeat(upper.length)}`;
    }
    renderSection(heading) {
        return `${heading}\n${"-".repeat(heading.length)}`;
    }
    renderParagraph(text) {
        return text;
    }
    renderList(items) {
        if (items.length === 0)
            return "(Sin elementos)";
        return items.map((item) => `  * ${item}`).join("\n");
    }
    renderScore(label, score, max, comment) {
        const line = `  ${label}: ${score}/${max}`;
        return comment ? `${line}\n    > ${comment}` : line;
    }
    renderKeyValue(key, value) {
        return `${key}: ${value}`;
    }
    compose(_title, blocks) {
        return blocks.join("\n\n") + "\n";
    }
}
exports.PlainTextRenderer = PlainTextRenderer;
//# sourceMappingURL=plain-text.renderer.js.map