"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRepository = setUserRepository;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.createUser = createUser;
const repository_factory_1 = require("../repositories/repository.factory");
/**
 * Servicio de Dominio para Usuarios (DIP / OCP / SRP).
 * Delega la persistencia al contrato IUserRepository.
 */
let currentRepo = repository_factory_1.RepositoryFactory.getUserRepository();
function setUserRepository(repo) {
    currentRepo = repo;
}
async function getUserById(uid) {
    return currentRepo.getById(uid);
}
async function getUserByEmail(email) {
    return currentRepo.getByEmail(email);
}
async function createUser(user) {
    return currentRepo.create(user);
}
//# sourceMappingURL=users.service.js.map