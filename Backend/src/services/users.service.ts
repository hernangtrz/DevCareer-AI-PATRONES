import { RepositoryFactory } from "../repositories/repository.factory";
import { IUserRepository } from "../repositories/user.repository";
import { User } from "../types";

/**
 * Servicio de Dominio para Usuarios (DIP / OCP / SRP).
 * Delega la persistencia al contrato IUserRepository.
 */
let currentRepo: IUserRepository = RepositoryFactory.getUserRepository();

export function setUserRepository(repo: IUserRepository): void {
  currentRepo = repo;
}

export async function getUserById(uid: string): Promise<User | null> {
  return currentRepo.getById(uid);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return currentRepo.getByEmail(email);
}

export async function createUser(user: User): Promise<void> {
  return currentRepo.create(user);
}
