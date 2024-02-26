import { Construct } from "constructs";
import { RestApi, LambdaIntegration, Cors, ApiKey, LogGroupLogDestination, AccessLogFormat } from "aws-cdk-lib/aws-apigateway";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Duration } from "aws-cdk-lib";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class ImageProcessorService extends Construct {

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = new Bucket(this, "ImageStore", {
      bucketName: "serverless-image-processor-store",
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.POST, HttpMethods.PUT],
          allowedOrigins: ["*"]
        }
      ],
    });

    const signedUploadUrlHandler = new Function(this, "SignedUploadUrlHandler", {
      functionName: "SignedUploadUrlLambda",
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("build/resources/lambda/signed-url-for-upload"),
      handler: "handler.handle",
      timeout: Duration.minutes(1),
      environment: {
          BUCKET: bucket.bucketName
      }
    });

    const uploadHandler = new Function(this, "UploadImageHandler", {
      functionName: "UploadImageLambda",
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("build/resources/lambda/upload"),
      handler: "handler.handle",
      timeout: Duration.minutes(2),
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    const resizeHandler = new Function(this, "ResizeImageHandler", {
      functionName: "ResizeImageLambda",
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("build/resources/lambda/resize"),
      handler: "handler.handle",
      timeout: Duration.minutes(2),
      environment: {
          BUCKET: bucket.bucketName
      },
    });

    const downloadHandler = new Function(this, "DownloadImageHandler", {
      functionName: "DownloadImageLambda",
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("build/resources/lambda/download"),
      handler: "handler.handle",
      timeout: Duration.minutes(1),
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    bucket.grantReadWrite(signedUploadUrlHandler);
    bucket.grantReadWrite(uploadHandler);
    bucket.grantReadWrite(resizeHandler);

    const apiKey = new ApiKey(this, "ImageProcessorApiKey", {
      apiKeyName: "image-processor-api-key",
      description: "API key for authenticating with image processor API",
      enabled: true,
    });

    const api = new RestApi(this, "image-processor", {
      restApiName: "image-processor",
      description: "This service supports image processing.",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
      binaryMediaTypes: ["image/*"],
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(new LogGroup(this, "AccessLogs")),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        tracingEnabled: true,
      }
    });

    const apiUsagePlan = api.addUsagePlan("ImageProcessorUsagePlan", {
      name: "image-processor-usage-plan",
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        }
      ]
    });

    apiUsagePlan.addApiKey(apiKey);

    const signedUploadUrlIntegration = new LambdaIntegration(signedUploadUrlHandler, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    const uploadIntegration = new LambdaIntegration(uploadHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    const resizeIntegration = new LambdaIntegration(resizeHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    const downloadIntegration = new LambdaIntegration(downloadHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addResource("signed-upload-url").addMethod("GET", signedUploadUrlIntegration, { apiKeyRequired: true });
    api.root.addResource("upload").addMethod("POST", uploadIntegration, { apiKeyRequired: true });
    api.root.addResource("resize").addMethod("GET", resizeIntegration, { apiKeyRequired: true });
    api.root.addResource("download").addMethod("GET", downloadIntegration, { apiKeyRequired: true });
  }
}