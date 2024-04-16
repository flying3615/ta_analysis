# End to End testing

- [End to End testing](#end-to-end-testing)
  - [Environment Variables](#environment-variables)
  - [Prerequisites](#prerequisites)
  - [How to run or debug tests](#how-to-run-or-debug-tests)
    - [With docker](#with-docker)
    - [Running projects locally](#running-projects-locally)
    - [Run the e2e tests](#run-the-e2e-tests)

* e2e UI tests are written in Playwright
* Configuration is set in 'playwright.config.ts' and the test environments are configured in env folder under utils.
* Framework follows page object model for e2e testing.
* Tests are in [./tests folder](./tests).

## Environment Variables

There is an [example .env file](./.env-example) you can use for the .env file. Create your own .env file in the main e2e directory and set the correct values for the variables:

## Prerequisites

Have [Node.js](https://nodejs.org/en/) installed in your machine. Have any IDE of your choice installed to run all the tests. 

## How to run or debug tests

### With docker
Build the plangen project:  
backend:
`gradle task build`  
frontend:
`npm run build`

Verify you have file `.env` in the landonline-survey-plan-generation root directory with correct informations (ask team)

In landonline-survey-plan-generation root directory launch the following docker command :
`docker compose up`

### Running projects locally
Start the full stack on your local env:
- From docker compose:
  - informix-db
  - auth-stack
- plangen back end and front end with gradle and npm tasks

### Run the e2e tests

```
npm ci
```

Then use the command to start the test

```
npm test
```

To view the HTML reports run the below command

```
npm run htmlreport
```
## FAQ

### How to run only one test
You can run only one test or a set of test with the following command :
`npm test 'path of the test who want to run'`


