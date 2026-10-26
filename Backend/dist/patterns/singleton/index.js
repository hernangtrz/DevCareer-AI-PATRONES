"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_REPORT_FORMATS = exports.resolveReportRenderer = exports.JobPortalAdapterRegistry = exports.InterviewPrototypeRegistry = void 0;
/**
 * PATRÓN CREACIONAL SINGLETON (GoF)
 * Puntos de acceso global con instancia única para catálogos y registros del sistema.
 */
var interview_prototype_registry_1 = require("../prototype/interview-prototype.registry");
Object.defineProperty(exports, "InterviewPrototypeRegistry", { enumerable: true, get: function () { return interview_prototype_registry_1.InterviewPrototypeRegistry; } });
var job_portal_adapter_registry_1 = require("../adapter/job-portal-adapter.registry");
Object.defineProperty(exports, "JobPortalAdapterRegistry", { enumerable: true, get: function () { return job_portal_adapter_registry_1.JobPortalAdapterRegistry; } });
var report_renderer_registry_1 = require("../bridge/report-renderer.registry");
Object.defineProperty(exports, "resolveReportRenderer", { enumerable: true, get: function () { return report_renderer_registry_1.resolveReportRenderer; } });
Object.defineProperty(exports, "SUPPORTED_REPORT_FORMATS", { enumerable: true, get: function () { return report_renderer_registry_1.SUPPORTED_REPORT_FORMATS; } });
//# sourceMappingURL=index.js.map