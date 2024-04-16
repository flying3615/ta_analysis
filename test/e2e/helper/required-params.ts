import { config } from 'dotenv';

export const loadEnvironmentVariablesFromFile = (): void => {
  config({ path: './.env' });
  checkRequiredEnvironmentVariables();
};

const checkRequiredEnvironmentVariables = (): void => {
  if (!process.env.BASE_URL) {
    throw new Error('The BASE_URL environment variable is not set');
  }
  if (!process.env.TEST_USERNAME) {
    throw new Error('The TEST_USERNAME environment variable is not set');
  }
  if (!process.env.TEST_PASSWORD) {
    throw new Error('The TEST_PASSWORD environment variable is not set');
  }
};

export const BASE_URL: string = process.env.BASE_URL ?? 'http://localhost:11065/plan-generation/';
export const AUTH_URL: string = process.env.AUTH_URL ?? 'http://keycloak:8080/realms/landonline/';
export const TEST_USERNAME: string = process.env.TEST_USERNAME;
export const TEST_PASSWORD: string = process.env.TEST_PASSWORD;
