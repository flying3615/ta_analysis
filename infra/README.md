# Deployment Infrastructure

The infrastructure defined here is based upon the documentation [provided here](https://toitutewhenua.atlassian.net/wiki/spaces/STEP/pages/364151558/SPAs+Cloudfront+S3+migration+guide).

## CDK config

In [bin/infra.ts](./bin/infra.ts), the config for the GitHub CI role is defined,
as well as the config for the nonprod, preprod, and prod environments.

The GitHub CI role is needed in order to run CI checks such as tests and for publishing releases.

### Deployment Commands

These commands are run when initially setting up the infrastructure.
They only need to be run when the infrastructure has changed, or has been destroyed and needs to be recreated.

Each environment (nonprod/preprod/prod) has its own S3 stack and deployment IAM role.

#### Github CI role

- Login: `aws-azure-login --mode gui --profile step-survey-new-nonprod`
- Deploy the role: `npx cdk deploy landonline-survey-plangen-ci-role --region ap-southeast-2 --profile step-survey-new-nonprod`

#### Nonprod stack

- Login: `aws-azure-login --mode gui --profile step-survey-new-nonprod`
- Deploy the api stack: `npx cdk deploy landonline-survey-plangen-fe-nonprod --region ap-southeast-2 --profile step-survey-new-nonprod`

#### Preprod stack

- Login: `aws-azure-login --mode gui --profile step-survey-preprod`
- Deploy the api stack: `npx cdk deploy landonline-survey-plangen-fe-preprod --region ap-southeast-2 --profile step-survey-preprod`

#### Prod stack

- Login: `aws-azure-login --mode gui --profile step-survey-prod`
- Deploy the api stack: `npx cdk deploy landonline-survey-plangen-fe-prod --region ap-southeast-2 --profile step-survey-prod`
