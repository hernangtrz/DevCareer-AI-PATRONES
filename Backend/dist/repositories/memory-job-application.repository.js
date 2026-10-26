"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryJobApplicationRepository = void 0;
const uuid_1 = require("uuid");
class MemoryJobApplicationRepository {
    async create(app) {
        const id = "app-" + (0, uuid_1.v4)().slice(0, 8);
        const item = { id, ...app };
        MemoryJobApplicationRepository.store.set(id, item);
        return id;
    }
    async getByUserId(userId) {
        return Array.from(MemoryJobApplicationRepository.store.values()).filter((a) => a.userId === userId);
    }
    async getById(id) {
        return MemoryJobApplicationRepository.store.get(id) || null;
    }
    async updateStatus(id, status) {
        const item = MemoryJobApplicationRepository.store.get(id);
        if (item) {
            item.status = status;
        }
    }
    async delete(id) {
        MemoryJobApplicationRepository.store.delete(id);
    }
}
exports.MemoryJobApplicationRepository = MemoryJobApplicationRepository;
MemoryJobApplicationRepository.store = new Map();
//# sourceMappingURL=memory-job-application.repository.js.map