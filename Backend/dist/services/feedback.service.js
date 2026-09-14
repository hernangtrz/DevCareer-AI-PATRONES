"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeedbackRepository = setFeedbackRepository;
exports.createFeedbackRecord = createFeedbackRecord;
exports.getFeedbackByInterviewId = getFeedbackByInterviewId;
const repository_factory_1 = require("../repositories/repository.factory");
/**
 * Servicio de Dominio para Feedback (DIP / LSP / SRP).
 * Delega la persistencia al contrato IFeedbackRepository.
 */
let currentRepo = repository_factory_1.RepositoryFactory.getFeedbackRepository();
function setFeedbackRepository(repo) {
    currentRepo = repo;
}
async function createFeedbackRecord(feedback) {
    return currentRepo.create(feedback);
}
async function getFeedbackByInterviewId(interviewId, userId) {
    return currentRepo.getByInterviewId(interviewId, userId);
}
//# sourceMappingURL=feedback.service.js.map