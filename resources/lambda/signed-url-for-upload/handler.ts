import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handle = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const s3Client = new S3Client({});
        const bucketName = process.env.BUCKET;

        const imageName = event.queryStringParameters ? event.queryStringParameters["imageName"]: undefined;
        if (imageName === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Required query parameter imageName missing."
                }),
            };
        }

        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: imageName
        });

        const signedUploadUrl = await getSignedUrl(s3Client, uploadCommand, {expiresIn: 3600});

        return {
            statusCode: 200,
            body: signedUploadUrl,
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            body: error.stack || JSON.stringify(error, null, 2),
        }
    }
}