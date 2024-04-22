# End to End testing

- [End to End testing](#end-to-end-testing)
  - [Environment Variables](#environment-variables)
  - [Prerequisites](#prerequisites)
  - [How to run or debug tests](#how-to-run-or-debug-tests)
    - [With docker](#with-docker)
    - [Running projects locally](#running-projects-locally)
    - [Run the e2e tests](#run-the-e2e-tests)

* e2e UI tests are written in Playwright
* Configuration is set in 'playwright.config.ts'.
* Tests are in [./tests folder](./tests).

## Environment Variables

There is an [example .env file](./.env-example) you can use for the .env file. Create your own .env file in the main e2e directory and set the correct values for the variables:

## Prerequisites

Have [Node.js](https://nodejs.org/en/) installed in your machine. Have any IDE of your choice installed to run all the tests. 

## How to run or debug tests

### With docker

Verify you have file `.env` in the landonline-survey-plan-generation/test/e2e directory with correct information (ask team)
Verify you have file `.env` in the landonline-survey-plan-generation root directory with correct information (ask team)

In landonline-survey-plan-generation root directory launch the following docker command :
`docker compose up`

### Run the e2e tests

```
npm test:ci
```

Then use the command to start the test in ci

```
npm test
```

Then use the command to start the test

```
npm test:debug
```

Then use the command to start the test in head and trace mode on

```
npm run htmlreport
```
## FAQ

### How to run only one test
You can run only one test or a set of test with the following command :
`npm test 'path of the test who want to run'`


