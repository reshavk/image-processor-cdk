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
 env: { account: '<Account-Number>', region: '<AWS-region>' },
```
6. Run `cdk deploy` to deploy the application to the configured AWS account and region.


## Appendix

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
