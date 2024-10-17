// based on https://github.com/mswjs/msw-storybook-addon
// modified for msw >= 2.0

import type { StoryFn } from "@storybook/react";
import { isNodeProcess } from "is-node-process";
import type { RequestHandler } from "msw";
import { setupWorker, type SetupWorkerApi } from "msw/browser";
import type { SetupServerApi } from "msw/node";
import React from "react";

export type MswInitializeOptions = Parameters<SetupWorkerApi["start"]>[0] | Parameters<SetupServerApi["listen"]>[0];

export type MswParameters = {
  msw?: RequestHandler[] | { handlers: RequestHandler[] | Record<string, RequestHandler> };
};

export type MswContext = {
  parameters: MswParameters;
};

const IS_BROWSER = !isNodeProcess();
let API: SetupServerApi | SetupWorkerApi | undefined;

export function mswInitialize(
  options?: MswInitializeOptions,
  initialHandlers: RequestHandler[] = [],
): SetupServerApi | SetupWorkerApi {
  if (IS_BROWSER) {
    const worker = setupWorker(...initialHandlers) as SetupWorkerApi;
    void worker.start(options);
    API = worker;
  } else {
    // eslint-disable-next-line
    const server = require("msw/node").setupServer(...initialHandlers) as SetupServerApi;
    server.listen(options);
    API = server;
  }

  return API;
}

export function mswDecorator(Story: StoryFn, context: MswContext): JSX.Element {
  const {
    parameters: { msw },
  } = context;

  if (!API) {
    console.log("[MSW] api is undefined, call initialize() in .storybook/preview?");
  } else {
    API.resetHandlers();

    if (msw) {
      if (Array.isArray(msw) && msw.length > 0) {
        // Support an Array of request handlers (backwards compatability).
        API.use(...msw);
      } else if ("handlers" in msw && msw.handlers) {
        // Support an Array named request handlers handlers
        // or an Object of named request handlers with named arrays of handlers
        const handlers = Object.values(msw.handlers)
          .filter(Boolean)
          .reduce((handlers, handlersList) => handlers.concat(handlersList), [] as RequestHandler[]);

        if (handlers.length > 0) {
          API.use(...handlers);
        }
      }
    }
  }

  return <Story />;
}
