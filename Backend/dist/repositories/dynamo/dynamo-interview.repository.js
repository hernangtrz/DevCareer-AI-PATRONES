"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoInterviewRepository = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../../config/dynamo");
const uuid_1 = require("uuid");
class DynamoInterviewRepository {
    constructor(dynamoClient) {
        this.dynamo = dynamoClient;
    }
    async getById(id) {
        const result = await this.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: dynamo_1.TABLES.INTERVIEWS,
            Key: { id },
        }));
        if (!result.Item)
            return null;
        return result.Item;
    }
    async getByUserId(userId) {
        const result = await this.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: dynamo_1.TABLES.INTERVIEWS,
            IndexName: "userId-createdAt-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: { ":userId": userId },
            ScanIndexForward: false,
        }));
        return (result.Items || []);
    }
    async getLatest(userId, limit = 20) {
        const result = await this.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: dynamo_1.TABLES.INTERVIEWS,
            FilterExpression: "finalized = :finalized AND userId <> :userId",
            ExpressionAttributeValues: {
                ":finalized": true,
                ":userId": userId,
            },
            Limit: limit * 3,
        }));
        const items = (result.Items || []);
        return items
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }
    async create(interview) {
        const id = (0, uuid_1.v4)();
        const item = { id, ...interview };
        await this.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: dynamo_1.TABLES.INTERVIEWS,
            Item: item,
        }));
        return id;
    }
    async update(interview) {
        await this.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: dynamo_1.TABLES.INTERVIEWS,
            Item: interview,
        }));
    }
}
exports.DynamoInterviewRepository = DynamoInterviewRepository;
//# sourceMappingURL=dynamo-interview.repository.js.map