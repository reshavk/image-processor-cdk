import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ImageProcessorService } from './image-processor-service';

export class ImageProcessorCdkStack extends Stack {
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const imageProcessorService = new ImageProcessorService(this, "ImageProcessorService");
  }
}
