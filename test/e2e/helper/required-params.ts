import { config } from "dotenv";

export const loadEnvironmentVariablesFromFile = (): void => {
  config();
  checkRequiredEnvironmentVariables();
};

const checkRequiredEnvironmentVariables = (): void => {
  if (!process.env.APP_URL) {
    throw new Error("The APP_URL environment variable is not set");
  }
  if (!process.env.TEST_USERNAME) {
    throw new Error("The TEST_USERNAME environment variable is not set");
  }
  if (!process.env.TEST_PASSWORD) {
    throw new Error("The TEST_PASSWORD environment variable is not set");
  }
};

export const APP_URL: string =
  process.env.APP_URL ?? "http://localhost:11065/plan-generation/";
export const AUTH_URL: string =
  process.env.AUTH_URL ?? "http://keycloak:8081/realms/landonline/";
export const TEST_USERNAME: string = process.env.TEST_USERNAME;
export const TEST_PASSWORD: string = process.env.TEST_PASSWORD;
