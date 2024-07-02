import { SetupWorker, setupWorker } from "msw/browser";
import { handlers } from "./mockHandlers.ts";
export const worker: SetupWorker = setupWorker(...handlers);
