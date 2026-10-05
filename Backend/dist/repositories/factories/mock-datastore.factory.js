"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataStoreFactory = void 0;
const datastore_factory_1 = require("./datastore.factory");
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA PRUEBAS UNITARIAS / MOCKS (GoF)
 * ============================================================================
 * Instancia repositorios simulados en memoria sin dependencias de red.
 */
class MockDataStoreFactory extends datastore_factory_1.DataStoreFactory {
    constructor(mockInterviews = {}, mockFeedbacks = {}, mockUsers = {}) {
        super();
        this.mockInterviews = mockInterviews;
        this.mockFeedbacks = mockFeedbacks;
        this.mockUsers = mockUsers;
    }
    createInterviewRepository() {
        const data = this.mockInterviews;
        return {
            async getById(id) { return data[id] || null; },
            async getByUserId(userId) { return Object.values(data).filter((i) => i.userId === userId); },
            async getLatest(userId, limit = 20) { return Object.values(data).slice(0, limit); },
            async create(interview) { const id = "mock_interview_id"; data[id] = { id, ...interview }; return id; },
            async update(interview) { data[interview.id] = interview; },
        };
    }
    createFeedbackRepository() {
        const data = this.mockFeedbacks;
        return {
            async create(feedback) { const id = "mock_feedback_id"; data[id] = { id, ...feedback }; return id; },
            async getByInterviewId(interviewId) { return Object.values(data).find((f) => f.interviewId === interviewId) || null; },
        };
    }
    createUserRepository() {
        const data = this.mockUsers;
        return {
            async getById(uid) { return data[uid] || null; },
            async getByEmail(email) { return Object.values(data).find((u) => u.email === email) || null; },
            async create(user) { data[user.id] = user; },
        };
    }
}
exports.MockDataStoreFactory = MockDataStoreFactory;
//# sourceMappingURL=mock-datastore.factory.js.map