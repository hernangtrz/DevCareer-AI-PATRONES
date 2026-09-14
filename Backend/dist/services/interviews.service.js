"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setInterviewRepository = setInterviewRepository;
exports.getInterviewsByUserId = getInterviewsByUserId;
exports.getLatestInterviews = getLatestInterviews;
exports.getInterviewById = getInterviewById;
exports.createInterview = createInterview;
exports.updateInterview = updateInterview;
const repository_factory_1 = require("../repositories/repository.factory");
/**
 * Servicio de Dominio para Entrevistas (DIP / OCP / SRP).
 * Delega la persistencia al contrato IInterviewRepository obtenido mediante la factoría.
 */
let currentRepo = repository_factory_1.RepositoryFactory.getInterviewRepository();
function setInterviewRepository(repo) {
    currentRepo = repo;
}
async function getInterviewsByUserId(userId) {
    return currentRepo.getByUserId(userId);
}
async function getLatestInterviews(userId, limit = 20) {
    return currentRepo.getLatest(userId, limit);
}
async function getInterviewById(id) {
    return currentRepo.getById(id);
}
async function createInterview(interview) {
    return currentRepo.create(interview);
}
async function updateInterview(interview) {
    return currentRepo.update(interview);
}
//# sourceMappingURL=interviews.service.js.map