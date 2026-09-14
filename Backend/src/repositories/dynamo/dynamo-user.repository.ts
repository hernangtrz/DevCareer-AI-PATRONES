import { IUserRepository } from "../user.repository";
import { User } from "../../types";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../config/dynamo";

export class DynamoUserRepository implements IUserRepository {
  private dynamo: any;

  constructor(dynamoClient: any) {
    this.dynamo = dynamoClient;
  }

  async getById(uid: string): Promise<User | null> {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { id: uid },
      })
    );
    if (!result.Item) return null;
    return result.Item as User;
  }

  async getByEmail(email: string): Promise<User | null> {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: TABLES.USERS,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) return null;
    return result.Items[0] as User;
  }

  async create(user: User): Promise<void> {
    await this.dynamo.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user,
        ConditionExpression: "attribute_not_exists(id)",
      })
    );
  }
}
