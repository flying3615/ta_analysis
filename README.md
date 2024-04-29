# Landonline Survey Plan Generation (PlanGen)

This repository contains Landonline Survey Plan Generation (PlanGen), which allows a surveyor to create title and survey plans for an inflight survey.

The back end API for this codebase is found [HERE](https://github.com/linz/landonline-survey-plan-generation-api)

## Where is it deployed

-   [Kartoffel](https://kartoffel.dev.landonline.govt.nz/plan-generation/)
-   [Kumara (pre-prod)](https://kumara.env.landonline.govt.nz/plan-generation/)
-   [Prod](https://app.landonline.govt.nz/plan-generation/)

[See here](infra/README.md) for documentation on the infrastructure.

## Local Development

### Setup

To get started, install the following software first:
-   Git
-   Node 18+
-   [aws-azure-login](https://www.npmjs.com/package/aws-azure-login)
-   [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

### Source control
Branches should start with the jira ticket and contain a short description (dash separated)
`<jira-ticket>/<short-description>`
e.g.
`SJ-824/update-readme`

Commit should follow the format of [conventional commit](https://toitutewhenua.atlassian.net/wiki/spaces/STEP/pages/207192124/PR+commit+and+tagging+conventions)

`<type>: <jira-ticket> <short-description of change>`

Examples:

* `feat: SJ-123 Created sidebar options for text formatting`
* `fix: SJ-456 Fixed right click behavior on the map`
* `chore: SJ-789 Added security check in CI github workflow`
* `docs: SJ-1001 Update infrastructure README docs`

Note: for this repo, `feat`/`fix`/`chore`/etc must be lowercase

### Running Locally

Once packages have been installed (via `npm install`), then you can simply run the app for local development.

There are four ways to develop for this app locally:

1. Develop by running storybook which lets you develop at an individual component level: `npm run storybook`
2. Develop by using the nonprod api and auth services: `npm run start:nonprod`
3. Develop by having the api and auth services also running locally on your machine: `npm run start`. You'll need to setup the API - [see here for how to do this](https://github.com/linz/landonline-survey-plan-generation-api/blob/master/README.md#local-development).
4. Develop by running containers defined in this repo via `docker compose up --scale frontend=0 -d` under root folder, and `npm run start` in /web folder



#### Scripts

-   `npm i` - install dependencies
-   `npm run start` - start application (using local api and auth)
-   `npm run start:nonprod` - start application (using nonprod api and auth)
-   `npm run lint` - check linting
-   `npm run test` - run jest tests
-   `npm run storybook` - run storybook for visual regression testing
-   `npm run allure:open` - view allure test report dashboard
-   (Further scripts in [package.json](./web/package.json))

#### E2E tests

(Refer to [README.md](test/e2e/README.md)) 
