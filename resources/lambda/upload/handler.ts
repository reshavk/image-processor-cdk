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

        const base64Image = event.body;
        const contentType = event.headers['Content-Type'];
        const decodedImage = base64Image? Buffer.from(base64Image, 'base64') : undefined;

        if (decodedImage === undefined || contentType === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Required image or image type to be uploaded is not present in request."
                }),
            };
        }

        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: imageName,
            Body: decodedImage,
            ContentType: contentType
        });

        await s3Client.send(uploadCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Image uploaded successfully."
            }),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: error.stack || JSON.stringify(error, null, 2),
        }
    }
}