"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceReport = void 0;
/**
 * Patrón Bridge (Estructural - GoF) — ABSTRACTION
 *
 * Representa "QUÉ" se reporta (estructura y contenido de un reporte de desempeño).
 * Mantiene una referencia (el "puente") a un IReportRenderer que define "CÓMO" se escribe.
 * Las subclases (Refined Abstractions) solo describen el contenido usando las primitivas
 * del renderer, sin conocer ninguna sintaxis concreta.
 */
class PerformanceReport {
    constructor(renderer) {
        this.renderer = renderer;
    }
    /** Permite cambiar el formato en tiempo de ejecución sin recrear el reporte. */
    setRenderer(renderer) {
        this.renderer = renderer;
        return this;
    }
    /** Template común: título + bloques + envoltura del formato. */
    render() {
        const title = this.getTitle();
        return this.renderer.compose(title, [this.renderer.renderTitle(title), ...this.buildBlocks()]);
    }
    export() {
        return {
            content: this.render(),
            contentType: this.renderer.contentType,
            filename: `${this.getBaseFilename()}.${this.renderer.fileExtension}`,
        };
    }
}
exports.PerformanceReport = PerformanceReport;
//# sourceMappingURL=performance-report.abstraction.js.map