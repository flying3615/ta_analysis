import { loadEnvironmentVariablesFromFile } from "./helper/required-params";

export default function globalSetup(): void {
  loadEnvironmentVariablesFromFile();
}
