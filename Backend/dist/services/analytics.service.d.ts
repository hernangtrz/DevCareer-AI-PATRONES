export interface PillarMetric {
    name: string;
    score: number;
    benchmark: number;
    status: string;
}
export interface WeeklyPoint {
    day: string;
    score: number;
    target: number;
}
export interface BlindspotItem {
    id: string;
    severity: "high" | "medium" | "low";
    title: string;
    detail: string;
    action: string;
    category: string;
}
export interface ActivityItem {
    id: string;
    type: "application" | "interview" | "challenge";
    title: string;
    company: string;
    timestamp: string;
    score?: number;
    status: string;
}
export interface UserAnalyticsSummary {
    userId: string;
    readinessScore: number;
    readinessLevel: string;
    targetDelta: string;
    metrics: {
        totalInterviews: number;
        challengesCompleted: number;
        challengeSuccessRate: number;
        activeStreakDays: number;
        practiceHoursMonth: number;
        totalApplications: number;
        interviewingApplications: number;
        offeredApplications: number;
        rejectedApplications: number;
    };
    pillars: PillarMetric[];
    weeklyProgress: WeeklyPoint[];
    blindspots: BlindspotItem[];
    recentActivity: ActivityItem[];
}
/**
 * Servicio de Analíticas Reales del Candidato (Single Responsibility & Open/Closed).
 * Consolida datos de la base de datos de Supabase (interviews, feedback)
 * y del repositorio persistente de postulaciones de empleo.
 */
export declare function calculateRealUserAnalytics(userId: string): Promise<UserAnalyticsSummary>;
