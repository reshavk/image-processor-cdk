import { GetObjectAclCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as sharp from "sharp";
import { Readable } from "stream";

type Dimension = {
    width: number
    height: number
}

export const handle = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const thumbnailDimension: Dimension = { width: 150, height: 150};
    const mediumDimension: Dimension = { width: 1200, height: 630 };
    const largeDimension: Dimension = { width: 1920, height: 1080} ;

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

        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: imageName,
        });

        const response = await s3Client.send(getCommand);
        const contentType = response.ContentType;
        const stream = response.Body as Readable;
        const imageBuffer =  Buffer.concat(await stream.toArray());

        const imageThumbnailBuffer = await sharp(imageBuffer).resize(thumbnailDimension).toBuffer();
        const imageMediumBuffer = await sharp(imageBuffer).resize(mediumDimension).toBuffer();
        const imageLargeBuffer = await sharp(imageBuffer).resize(largeDimension).toBuffer();

        const putImageThumbnailCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${imageName}-thumbnail`,
            Body: imageThumbnailBuffer,
            ContentType: contentType,
        });
        const putImageMediumCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${imageName}-medium`,
            Body: imageMediumBuffer,
            ContentType: contentType,
        });
        const putImageLargeCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${imageName}-large`,
            Body: imageLargeBuffer,
            ContentType: contentType,
        });

        await s3Client.send(putImageThumbnailCommand);
        await s3Client.send(putImageMediumCommand);
        await s3Client.send(putImageLargeCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Uploaded image resized successfully to thumbnail, medium and large sizes.",
            }),
        };
    } catch(err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to resize uploaded image.",
            }),
        };
    }
}