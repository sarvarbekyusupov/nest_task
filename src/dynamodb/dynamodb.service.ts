import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

@Injectable()
export class DynamoDBService implements OnModuleInit, OnModuleDestroy {
  private client: DynamoDBClient;
  public docClient: DynamoDBDocumentClient;

  onModuleInit() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }

  onModuleDestroy() {
    this.client.destroy();
  }
}
