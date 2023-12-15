# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## How to deploy

    # login first with
    aws-azure-login --mode gui --profile step-survey-new-nonprod

    # check you can list the stacks
    npx cdk list --profile step-survey-new-nonprod --region ap-southeast-2

    # check it compiles
    npx cdk synth --profile step-survey-new-nonprod --region ap-southeast-2

    # deploy iam roles for github actions first
    npx cdk deploy landonline-survey-plangen-ci-role --profile step-survey-new-nonprod --region ap-southeast-2

    # deploy the actual stack
    npx cdk deploy landonline-survey-plangen-bucket-nonprod --profile step-survey-new-nonprod --region ap-southeast-2
