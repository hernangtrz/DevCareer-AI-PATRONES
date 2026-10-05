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
export declare class MockDataStoreFactory extends DataStoreFactory {
    private mockInterviews;
    private mockFeedbacks;
    private mockUsers;
    constructor(mockInterviews?: Record<string, any>, mockFeedbacks?: Record<string, any>, mockUsers?: Record<string, any>);
    createInterviewRepository(): IInterviewRepository;
    createFeedbackRepository(): IFeedbackRepository;
    createUserRepository(): IUserRepository;
}
