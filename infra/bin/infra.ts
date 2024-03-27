import { AwsAccounts, AwsEnv, LinzAccountName } from '@linz/accounts';
import { StaticSiteBucketStack } from '@linz/linz-static-site';
import { StepGithubCIRoleStack } from '@linz/step-utils';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

new StepGithubCIRoleStack(app, 'landonline-survey-plangen-ci-role', {
  applicationName: 'survey-plangen-app',
  env: {
    account: AwsAccounts.byNameEnv(LinzAccountName.StepSurvey, AwsEnv.NonProduction).id,
    region: 'ap-southeast-2',
  },
  githubRepo: 'linz/landonline-survey-plangen',
  pushRepos: ['step/survey/step-landonline-web-survey-plangen-fe'],
});

const config = {
  nonprod: {
    environmentName: 'nonprod',
    environmentType: AwsEnv.NonProduction,
  },
  preprod: {
    environmentName: 'preprod',
    environmentType: AwsEnv.PreProduction,
  },
  // prod: {
  //   environmentName: 'prod',
  //   environmentType: AwsEnv.Production,
  // },
};

Object.values(config).map((values) => {
  // Create new s3 buckets for hosting site - https://github.com/linz/lucl/tree/master/packages/linz-static-site
  //  This will also create an AWS role used for deploying to the bucket from github actions.
  new StaticSiteBucketStack(app, `landonline-survey-plangen-fe-${values.environmentName}`, {
    githubRepo: 'linz/landonline-survey-plan-generation',
    bucketName: `linz-landonline-survey-plangen-fe-${values.environmentName}`,
    websiteErrorDocument: 'plan-generation/index.html',
  });
});
