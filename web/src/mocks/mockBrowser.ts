import { SetupWorker, setupWorker } from "msw/browser";

import { handlers } from "./mockHandlers";
export const worker: SetupWorker = setupWorker(...handlers);
