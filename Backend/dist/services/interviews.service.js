"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setInterviewRepository = setInterviewRepository;
exports.getInterviewsByUserId = getInterviewsByUserId;
exports.getLatestInterviews = getLatestInterviews;
exports.getInterviewById = getInterviewById;
exports.createInterview = createInterview;
exports.updateInterview = updateInterview;
exports.createInterviewFromTemplate = createInterviewFromTemplate;
exports.cloneInterview = cloneInterview;
exports.deleteInterview = deleteInterview;
exports.editInterview = editInterview;
const repository_factory_1 = require("../repositories/repository.factory");
const prototype_1 = require("../patterns/prototype");
/**
 * Servicio de Dominio para Entrevistas (DIP / OCP).
 * Delega la persistencia al contrato IInterviewRepository obtenido mediante la factoría
 * e integra los patrones Prototype y Builder para la creación desacoplada.
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
/**
 * Patrón Prototype: Crea una nueva entrevista a partir de una plantilla registrada
 * utilizando clonación profunda (Deep Clone).
 */
async function createInterviewFromTemplate(templateId, userId) {
    const registry = prototype_1.InterviewPrototypeRegistry.getInstance();
    const prototypeClone = registry.clone(templateId);
    if (!prototypeClone) {
        return null;
    }
    // Prepara el clon para el usuario específico (nuevo timestamp, usuario asignado)
    prototypeClone.prepareForUser(userId, { finalized: true });
    return currentRepo.create(prototypeClone.toEntity());
}
/**
 * Patrón Prototype: Clona una entrevista histórica existente para permitir reintentarla
 * o duplicarla sin afectar la entrevista original.
 */
async function cloneInterview(interviewId, userId) {
    const existingInterview = await currentRepo.getById(interviewId);
    if (!existingInterview) {
        return null;
    }
    const prototype = prototype_1.InterviewPrototype.fromEntity(existingInterview);
    const cloned = prototype.clone();
    cloned.prepareForUser(userId, { finalized: true });
    return currentRepo.create(cloned.toEntity());
}
async function deleteInterview(id, userId) {
    const existing = await currentRepo.getById(id);
    if (!existing)
        return false;
    if (existing.userId !== userId) {
        throw new Error("No autorizado para eliminar esta entrevista");
    }
    await currentRepo.delete(id);
    return true;
}
async function editInterview(id, userId, updates) {
    const existing = await currentRepo.getById(id);
    if (!existing)
        return null;
    if (existing.userId !== userId) {
        throw new Error("No autorizado para editar esta entrevista");
    }
    const updated = {
        ...existing,
        ...updates,
        id: existing.id,
        userId: existing.userId,
    };
    await currentRepo.update(updated);
    return updated;
}
//# sourceMappingURL=interviews.service.js.map