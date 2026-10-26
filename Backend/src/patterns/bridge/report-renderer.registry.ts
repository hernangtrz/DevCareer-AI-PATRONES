import { IReportRenderer } from "./report-renderer.interface";
import { MarkdownRenderer } from "./renderers/markdown.renderer";
import { HtmlRenderer } from "./renderers/html.renderer";
import { PlainTextRenderer } from "./renderers/plain-text.renderer";
import { ExcelRenderer } from "./renderers/excel.renderer";

/**
 * Catálogo / Selector de implementadores disponibles para el Patrón Bridge (GoF).
 * Traduce el parámetro HTTP ?format= al renderer concreto.
 * Soporta HTML, Markdown (.md) y Excel (.csv) como formatos principales.
 */
const renderers: Record<string, () => IReportRenderer> = {
  md: () => new MarkdownRenderer(),
  markdown: () => new MarkdownRenderer(),
  html: () => new HtmlRenderer(),
  excel: () => new ExcelRenderer(),
  csv: () => new ExcelRenderer(),
  xlsx: () => new ExcelRenderer(),
  txt: () => new ExcelRenderer(), // El usuario solicitó reemplazar texto plano por excel
  text: () => new ExcelRenderer(),
};

export const SUPPORTED_REPORT_FORMATS = ["html", "md", "excel", "txt"] as const;

export function resolveReportRenderer(format?: string): IReportRenderer | null {
  const key = (format || "html").toLowerCase();
  const create = renderers[key];
  return create ? create() : null;
}
