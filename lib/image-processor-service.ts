import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";

export class ImageProcessorService extends Construct {

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "ImageStore");
    bucket.addCorsRule({
      allowedHeaders: ["*"],
      allowedMethods: [s3.HttpMethods.POST, s3.HttpMethods.PUT],
      allowedOrigins: ["*"]
    });

    const uploadHandler = new lambda.Function(this, "UploadImageHandler", {
      functionName: "UploadImageLambda",
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("build/resources/lambda"),
      handler: "upload-handler.handle",
      timeout: Duration.minutes(1),
      environment: {
          BUCKET: bucket.bucketName
      }
    });

    const sharpLayer = new lambda.LayerVersion(this, "SharpLayer", {
      layerVersionName: "SharpLayer",
      code: lambda.Code.fromAsset("lambda-layer-sharp-0.32.6.zip"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: "Layer for Sharp dependecy"
    });

    const resizeHandler = new lambda.Function(this, "ResizeImageHandler", {
      functionName: "ResizeImageLambda",
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("build/resources/lambda"),
      handler: "resize-handler.handle",
      timeout: Duration.minutes(2),
      environment: {
          BUCKET: bucket.bucketName
      },
    });

    bucket.grantReadWrite(uploadHandler);
    bucket.grantReadWrite(resizeHandler);

    const api = new apigateway.RestApi(this, "image-processor", {
      restApiName: "Image Processor",
      description: "This service supports image processing."
    });

    const uploadIntegration = new apigateway.LambdaIntegration(uploadHandler, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    const resizeIntegration = new apigateway.LambdaIntegration(resizeHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addResource("upload").addMethod("POST", uploadIntegration);
    api.root.addResource("resize").addMethod("GET", resizeIntegration);
  }

}