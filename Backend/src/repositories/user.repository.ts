import { User } from "../types";

/**
 * Contrato formal para la persistencia de usuarios (DIP / OCP).
 */
export interface IUserRepository {
  getById(uid: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
