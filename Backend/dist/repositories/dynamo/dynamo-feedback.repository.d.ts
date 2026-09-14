import { IFeedbackRepository } from "../feedback.repository";
import { Feedback } from "../../types";
export declare class DynamoFeedbackRepository implements IFeedbackRepository {
    private dynamo;
    constructor(dynamoClient: any);
    create(feedback: Omit<Feedback, "id">): Promise<string>;
    getByInterviewId(interviewId: string, userId: string): Promise<Feedback | null>;
}
