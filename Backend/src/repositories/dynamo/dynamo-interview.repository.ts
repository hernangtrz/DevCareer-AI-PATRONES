import { IInterviewRepository } from "../interview.repository";
import { Interview } from "../../types";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../config/dynamo";
import { v4 as uuidv4 } from "uuid";

export class DynamoInterviewRepository implements IInterviewRepository {
  private dynamo: any;

  constructor(dynamoClient: any) {
    this.dynamo = dynamoClient;
  }

  async getById(id: string): Promise<Interview | null> {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: TABLES.INTERVIEWS,
        Key: { id },
      })
    );
    if (!result.Item) return null;
    return result.Item as Interview;
  }

  async getByUserId(userId: string): Promise<Interview[]> {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: TABLES.INTERVIEWS,
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ScanIndexForward: false,
      })
    );
    return (result.Items || []) as Interview[];
  }

  async getLatest(userId: string, limit: number = 20): Promise<Interview[]> {
    const result = await this.dynamo.send(
      new ScanCommand({
        TableName: TABLES.INTERVIEWS,
        FilterExpression: "finalized = :finalized AND userId <> :userId",
        ExpressionAttributeValues: {
          ":finalized": true,
          ":userId": userId,
        },
        Limit: limit * 3,
      })
    );

    const items = (result.Items || []) as Interview[];
    return items
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  async create(interview: Omit<Interview, "id">): Promise<string> {
    const id = uuidv4();
    const item: Interview = { id, ...interview };

    await this.dynamo.send(
      new PutCommand({
        TableName: TABLES.INTERVIEWS,
        Item: item,
      })
    );
    return id;
  }

  async update(interview: Interview): Promise<void> {
    await this.dynamo.send(
      new PutCommand({
        TableName: TABLES.INTERVIEWS,
        Item: interview,
      })
    );
  }
}
