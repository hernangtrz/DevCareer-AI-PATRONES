import { IUserRepository } from "../repositories/user.repository";
import { User } from "../types";
export declare function setUserRepository(repo: IUserRepository): void;
export declare function getUserById(uid: string): Promise<User | null>;
export declare function getUserByEmail(email: string): Promise<User | null>;
export declare function createUser(user: User): Promise<void>;
