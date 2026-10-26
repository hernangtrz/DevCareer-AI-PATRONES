import { IReportRenderer } from "../report-renderer.interface";

/**
 * Patrón Bridge (Estructural - GoF) — CONCRETE IMPLEMENTOR: ExcelRenderer
 *
 * Renderiza los reportes en formato tabular estructurado (CSV/Excel) compatible
 * con Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Incluye Byte Order Mark (BOM) UTF-8 (\uFEFF) para garantizar que Excel en Windows
 * interprete correctamente los caracteres en español (tildes, eñes) sin problemas de codificación.
 */
export class ExcelRenderer implements IReportRenderer {
  readonly format = "excel";
  readonly contentType = "text/csv; charset=utf-8";
  readonly fileExtension = "csv";

  private escape(str: string): string {
    const s = String(str ?? "").replace(/"/g, '""');
    return `"${s}"`;
  }

  renderTitle(text: string): string {
    return `${this.escape("REPORTE")},${this.escape(text)}`;
  }

  renderSection(heading: string): string {
    return `\n${this.escape(">>> " + heading.toUpperCase())},""`;
  }

  renderParagraph(text: string): string {
    return `${this.escape("Detalle")},${this.escape(text)}`;
  }

  renderList(items: string[]): string {
    if (items.length === 0) return `${this.escape("Lista")},${this.escape("(Sin elementos)")}`;
    return items
      .map((item, idx) => `${this.escape(`Elemento ${idx + 1}`)},${this.escape(item)}`)
      .join("\n");
  }

  renderScore(label: string, score: number, max: number, comment?: string): string {
    const comm = comment ? ` (${comment})` : "";
    return `${this.escape(label)},${this.escape(`${score}/${max}${comm}`)}`;
  }

  renderKeyValue(key: string, value: string): string {
    return `${this.escape(key)},${this.escape(value)}`;
  }

  compose(title: string, blocks: string[]): string {
    const bom = "\uFEFF";
    const header = `${this.escape("PARÁMETRO / SECCIÓN")},${this.escape("VALOR / DESCRIPCIÓN")}\n`;
    return bom + header + blocks.filter(Boolean).join("\n") + "\n";
  }
}
