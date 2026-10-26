import { IReportRenderer } from "./report-renderer.interface";
export declare const SUPPORTED_REPORT_FORMATS: readonly ["html", "md", "excel", "txt"];
export declare function resolveReportRenderer(format?: string): IReportRenderer | null;
