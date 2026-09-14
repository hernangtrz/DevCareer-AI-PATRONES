import { IFeedbackRepository } from "../feedback.repository";
import { Feedback } from "../../types";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../config/dynamo";
import { v4 as uuidv4 } from "uuid";

export class DynamoFeedbackRepository implements IFeedbackRepository {
  private dynamo: any;

  constructor(dynamoClient: any) {
    this.dynamo = dynamoClient;
  }

  async create(feedback: Omit<Feedback, "id">): Promise<string> {
    const id = uuidv4();
    const item: Feedback = { id, ...feedback };

    await this.dynamo.send(
      new PutCommand({
        TableName: TABLES.FEEDBACK,
        Item: item,
      })
    );
    return id;
  }

  async getByInterviewId(interviewId: string, userId: string): Promise<Feedback | null> {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: TABLES.FEEDBACK,
        IndexName: "interviewId-userId-index",
        KeyConditionExpression:
          "interviewId = :interviewId AND userId = :userId",
        ExpressionAttributeValues: {
          ":interviewId": interviewId,
          ":userId": userId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) return null;

    const feedbacks = result.Items as Feedback[];
    return feedbacks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }
}
