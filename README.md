# image-processor-cdk

This is a serverless image processor which leverages AWS CDK for creating and deploying an application that exposes API(s) for image processing.
This application uses AWS SDK Javascript V3 for interfacing with AWS resources.

## Setup
1. Checkout this package from git.
2. Run `npm run build` command to transpile TS to JS and populate the JS in `build` directory.
3. Run `npm run postinstall` command to install any additional required node_module dependencies. We are leveraging postinstall in this package to install `sharp` library depdencies for image resize lambda.
4. Run `cdk synth` to emit the synthesized CloudFormation template. CFN template should be generated for the CDK package. The output of the command should be of the format:
```

    Default: /cdk-bootstrap/hnb659fds/version
    Description: Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]
Rules:
  CheckBootstrapVersion:
    Assertions:
      - Assert:
          Fn::Not:
            - Fn::Contains:
                - - "1"
                  - "2"
                  - "3"
                  - "4"
                  - "5"
                - Ref: BootstrapVersion
        AssertDescription: CDK bootstrap stack version 6 required. Please run 'cdk bootstrap' with a recent version of the CDK CLI.
```
5. Update the [image-processor.ts](./bin/image-processor.ts) source file to add your specific AWS account and region where you want to deploy this application.
```
 env: { account: '<AWS-Account-Number>', region: '<AWS-Region>' },
```
6. Run `cdk bootstrap aws://<Account-Number>/<AWS-region>` to bootstrap your AWS account for deployment
7. Run `cdk deploy` to deploy the application to the configured AWS account and region.

## Test Application
1. Go to API Gateway in your AWS account console for the AWS-Region used above. Open `image-processor` APIs. Copy the Invoke url of API you want to test by selecting `Stages > prod`.
2. Obtain the API Key from API Gateway console by selecting API keys from side-bar. Copy the Api Key secret to be used for authenticating the requests to API Gateway.
3. Use tool like Postman or cURL to hit the invoke url. Make sure to include header with key `x-api-key` and value set to API Key secret to authenticate and authorize your requests to the image processor API(s).

### Test `/upload`
1. Make a POST request to /upload API with following configuration:
2. Add query parameter with key `imageName` and value as the alias for image you want image processor to identify your image as. Ensure this alias is unique and keep this alias handy to use it as query param for other API(s).
3. Add binary image file in request body.
4. Add `x-api-key` header with value as API key.
5. Submit request.

### Test `/resize`
1. Make a GET request to /resize API with following configuration:
2. Add query parameter with key `imageName` and value as the alias for image already uploaded to image processor. **Please note if an image is not already uploaded with the same alias, you will get an Internal Server Error for resize API calls.**
4. Add `x-api-key` header with value as API key.
5. Submit request.

## Troubleshooting
The `ResizeImageLambda` deployed by this application uses [sharp](https://sharp.pixelplumbing.com/) module to perform image processing operations. Since,`sharp` is a native library, you can face issues when deploying this lambda specifically with the module not being compatible with your lambda architecture.
For instance if you perform npm installs in apple silicon machine (which is using amd64 architecture) and then deploy to lambda function with x86_64 architecture.

This package does contains a `package-lock.json` for resize lambda directory and perform a `npm ci` to ensure the dependencies listed in package-lock.json are installed for lambda dependencies, but underlying maching architecture can effect the module architecture.

If you are using apple machine with M1/M2 chip (i.e. Apple Silicon) and encounter issue with `ResizeImageLambda`, here are the steps for installing sharp with x86_64 architecture:

1. Install x86_64 Node.js:
Install Node.js for x86_64 architecture using a version manager like nvm or n.
```
arch -x86_64 /path/to/nvm install 18
```

2. Switch to x86_64 Node.js Environment:
```
arch -x86_64 /path/to/nvm use 18
```

3. Install Dependencies:
Run npm ci or npm install to install dependencies, including the sharp module, using the x86_64 Node.js environment.
```
arch -x86_64 npm ci
```

4. Build and Package:
Proceed with your build process and package your Lambda function for deployment. The resulting deployment package should include the sharp module compiled for x86_64 architecture.

Remember to replace /path/to/nvm with the actual path where your version manager (nvm, n, etc.) is located.

## Appendix

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
