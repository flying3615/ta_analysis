import { SetupServer, setupServer } from "msw/node";
import { handlers } from "@/mocks/mockHandlers";

export const server: SetupServer = setupServer(...handlers);
