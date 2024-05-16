import { SetupWorker, setupWorker } from "msw";
import { handlers } from "./mockHandlers.ts";
export const worker: SetupWorker = setupWorker(...handlers);
