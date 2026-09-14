"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoUserRepository = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../../config/dynamo");
class DynamoUserRepository {
    constructor(dynamoClient) {
        this.dynamo = dynamoClient;
    }
    async getById(uid) {
        const result = await this.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: dynamo_1.TABLES.USERS,
            Key: { id: uid },
        }));
        if (!result.Item)
            return null;
        return result.Item;
    }
    async getByEmail(email) {
        const result = await this.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: dynamo_1.TABLES.USERS,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email },
            Limit: 1,
        }));
        if (!result.Items || result.Items.length === 0)
            return null;
        return result.Items[0];
    }
    async create(user) {
        await this.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: dynamo_1.TABLES.USERS,
            Item: user,
            ConditionExpression: "attribute_not_exists(id)",
        }));
    }
}
exports.DynamoUserRepository = DynamoUserRepository;
//# sourceMappingURL=dynamo-user.repository.js.map