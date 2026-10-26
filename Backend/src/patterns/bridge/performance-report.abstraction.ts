import { IReportRenderer } from "./report-renderer.interface";

export interface ExportedReport {
  content: string;
  contentType: string;
  filename: string;
}

/**
 * Patrón Bridge (Estructural - GoF) — ABSTRACTION
 *
 * Representa "QUÉ" se reporta (estructura y contenido de un reporte de desempeño).
 * Mantiene una referencia (el "puente") a un IReportRenderer que define "CÓMO" se escribe.
 * Las subclases (Refined Abstractions) solo describen el contenido usando las primitivas
 * del renderer, sin conocer ninguna sintaxis concreta.
 */
export abstract class PerformanceReport {
  constructor(protected renderer: IReportRenderer) {}

  /** Permite cambiar el formato en tiempo de ejecución sin recrear el reporte. */
  setRenderer(renderer: IReportRenderer): this {
    this.renderer = renderer;
    return this;
  }

  /** Título legible del reporte. */
  protected abstract getTitle(): string;

  /** Nombre base del archivo (sin extensión). */
  protected abstract getBaseFilename(): string;

  /** Bloques de contenido construidos con las primitivas del renderer. */
  protected abstract buildBlocks(): string[];

  /** Template común: título + bloques + envoltura del formato. */
  render(): string {
    const title = this.getTitle();
    return this.renderer.compose(title, [this.renderer.renderTitle(title), ...this.buildBlocks()]);
  }

  export(): ExportedReport {
    return {
      content: this.render(),
      contentType: this.renderer.contentType,
      filename: `${this.getBaseFilename()}.${this.renderer.fileExtension}`,
    };
  }
}
