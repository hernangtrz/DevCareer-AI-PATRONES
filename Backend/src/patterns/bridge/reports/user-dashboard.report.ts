import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";

export interface DashboardStatsData {
  userId: string;
  userName: string;
  totalInterviews: number;
  averageScore: number;
  technicalScore: number;
  communicationScore: number;
  cefrLevel: string;
  topStrengths: string[];
  keyImprovements: string[];
  totalApplications: number;
}

/**
 * ============================================================================
 * PATRÓN BRIDGE — REFINED ABSTRACTION: UserDashboardReport
 * ============================================================================
 * Estructura el reporte de analíticas globales y evolución técnica del usuario
 * para ser emitido en cualquier formato (HTML, Markdown, Texto plano) mediante Bridge.
 */
export class UserDashboardReport extends PerformanceReport {
  constructor(
    private stats: DashboardStatsData,
    renderer: IReportRenderer
  ) {
    super(renderer);
  }

  protected getTitle(): string {
    return `Informe de Rendimiento y Analíticas de ${this.stats.userName} - DevCareer AI`;
  }

  protected getBaseFilename(): string {
    return `dashboard-analytics-${this.stats.userId}`;
  }

  protected buildBlocks(): string[] {
    const r = this.renderer;
    const s = this.stats;

    return [
      r.renderKeyValue("Desarrollador", s.userName),
      r.renderKeyValue("Nivel CEFR de Inglés", s.cefrLevel || "B2"),
      r.renderSection("Métricas Generales de Preparación"),
      r.renderScore("Puntaje Promedio General", s.averageScore, 100),
      r.renderScore("Habilidades Técnicas y Algoritmos", s.technicalScore, 100),
      r.renderScore("Habilidades Blandas y Comunicación", s.communicationScore, 100),
      r.renderKeyValue("Entrevistas Técnicas Completadas", s.totalInterviews.toString()),
      r.renderKeyValue("Postulaciones Laborales Activas", s.totalApplications.toString()),
      r.renderSection("Principales Fortalezas"),
      r.renderList(s.topStrengths && s.topStrengths.length > 0 ? s.topStrengths : ["Dominio de TypeScript y React", "Diseño de APIs REST"]),
      r.renderSection("Oportunidades de Crecimiento"),
      r.renderList(s.keyImprovements && s.keyImprovements.length > 0 ? s.keyImprovements : ["Profundizar en patrones de concurrencia", "Optimizar complejidad Big-O en algoritmos"]),
      r.renderSection("Dictamen del Mentor de IA"),
      r.renderParagraph(
        `El candidato ha mantenido un desempeño del ${s.averageScore}% a través de ${s.totalInterviews} sesiones de entrevista simulada. Su perfil presenta alta competitividad para posiciones de desarrollo de software internacional.`
      ),
    ];
  }
}
