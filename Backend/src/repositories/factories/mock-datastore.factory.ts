import { DataStoreFactory } from "./datastore.factory";
import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";

/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA PRUEBAS UNITARIAS / MOCKS (GoF)
 * ============================================================================
 * Instancia repositorios simulados en memoria sin dependencias de red.
 */
export class MockDataStoreFactory extends DataStoreFactory {
  constructor(
    private mockInterviews: Record<string, any> = {},
    private mockFeedbacks: Record<string, any> = {},
    private mockUsers: Record<string, any> = {}
  ) {
    super();
  }

  public createInterviewRepository(): IInterviewRepository {
    const data = this.mockInterviews;
    return {
      async getById(id: string) { return data[id] || null; },
      async getByUserId(userId: string) { return Object.values(data).filter((i: any) => i.userId === userId) as any; },
      async getLatest(userId: string, limit = 20) { return (Object.values(data) as any[]).slice(0, limit); },
      async create(interview: any) { const id = "mock_interview_id"; data[id] = { id, ...interview }; return id; },
      async update(interview: any) { data[interview.id] = interview; },
    };
  }

  public createFeedbackRepository(): IFeedbackRepository {
    const data = this.mockFeedbacks;
    return {
      async create(feedback: any) { const id = "mock_feedback_id"; data[id] = { id, ...feedback }; return id; },
      async getByInterviewId(interviewId: string) { return Object.values(data).find((f: any) => f.interviewId === interviewId) as any || null; },
    };
  }

  public createUserRepository(): IUserRepository {
    const data = this.mockUsers;
    return {
      async getById(uid: string) { return data[uid] || null; },
      async getByEmail(email: string) { return Object.values(data).find((u: any) => u.email === email) as any || null; },
      async create(user: any) { data[user.id] = user; },
    };
  }
}
