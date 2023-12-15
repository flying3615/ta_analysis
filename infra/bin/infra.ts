import * as cdk from 'aws-cdk-lib'
import { AwsAccounts, AwsEnv, LinzAccountName } from '@linz/accounts'
import { StaticSiteBucketStack } from '@linz/linz-static-site'
import { StepGithubCIRoleStack } from '@linz/step-utils'

const app = new cdk.App()

const config = {
  kartoffel: {
    environmentName: 'nonprod',
    environmentType: AwsEnv.NonProduction,
  }
}

Object.values(config).map((values) => {
  // Create new s3 buckets for hosting site - https://github.com/linz/lucl/tree/master/packages/linz-static-site
  //  This will also create an AWS role used for deploying to the bucket from github actions.
  new StaticSiteBucketStack(app, `landonline-survey-plangen-bucket-${values.environmentName}`, {
    githubRepo: 'linz/landonline-survey-plan-generation',
    bucketName: `linz-landonline-survey-plangen-${values.environmentName}`
  })
})

new StepGithubCIRoleStack(app, 'landonline-survey-plangen-ci-role', {
  applicationName: 'survey-plangen-app',
  env: {
    account: AwsAccounts.byNameEnv(
      LinzAccountName.StepSurvey,
      AwsEnv.NonProduction
    ).id,
    region: 'ap-southeast-2'
  },
  githubRepo: 'linz/landonline-survey-plan-generation',
  pushRepos: ['step/survey/step-landonline-web-survey-plan-generation-fe'],
})
