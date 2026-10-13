import { IReportRenderer } from "./report-renderer.interface";
import { MarkdownRenderer } from "./renderers/markdown.renderer";
import { HtmlRenderer } from "./renderers/html.renderer";
import { PlainTextRenderer } from "./renderers/plain-text.renderer";

/**
 * Catálogo simple de implementadores disponibles para el Bridge.
 * Traduce el parámetro HTTP `?format=` al renderer concreto.
 * Agregar un formato nuevo = crear la clase y registrarla aquí (los reportes no cambian).
 */
const renderers: Record<string, () => IReportRenderer> = {
  md: () => new MarkdownRenderer(),
  markdown: () => new MarkdownRenderer(),
  html: () => new HtmlRenderer(),
  txt: () => new PlainTextRenderer(),
  text: () => new PlainTextRenderer(),
};

export const SUPPORTED_REPORT_FORMATS = ["md", "html", "txt"] as const;

export function resolveReportRenderer(format?: string): IReportRenderer | null {
  const key = (format || "md").toLowerCase();
  const create = renderers[key];
  return create ? create() : null;
}
