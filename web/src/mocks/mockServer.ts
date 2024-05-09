import { setupServer } from "msw/node";
import { handlers } from "@/mocks/mockHandlers";

export const server = setupServer(...handlers);
