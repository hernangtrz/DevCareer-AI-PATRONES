import { IUserRepository } from "../user.repository";
import { User } from "../../types";
export declare class DynamoUserRepository implements IUserRepository {
    private dynamo;
    constructor(dynamoClient: any);
    getById(uid: string): Promise<User | null>;
    getByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<void>;
}
