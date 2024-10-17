// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/jest-globals";
import "@testing-library/jest-dom";
import "jest-canvas-mock";

import { mapAssertions, mapFeatureAssertions } from "@linzjs/landonline-openlayers-map";
import { configure } from "@testing-library/react";
import { setupJestCanvasMock } from "jest-canvas-mock";

import { server } from "@/mocks/mockServer";
import { FEATUREFLAGS, TREATMENTS } from "@/split-functionality/FeatureFlags.ts";
import { IFeatureToggleResult } from "@/split-functionality/UseFeatureFlags.ts";
import { coordinateMatchers } from "@/test-utils/jest-utils.tsx";

// It is critical that asyncUtilTimeout be lower than jest.setTimeout, or all
// the detail of an async assertion failure will be lost due to the test
// failing because of the overall timeout instead.
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(10000);

// app requires all these values to exist
window._env_ = {
  apiGatewayBaseUrl: "http://localhost/api",
  authzBaseUrl: "https://dummy.authz.url",
  basemapApiKey: "dummy",
  oidcIssuerUri: "https://auth.dev.landonline.govt.nz/realms/landonline",
  splitKey: "localhost",
  surveyBaseUrl: "http://localhost/v1/surveys",
  secureFileUploadBaseUrl: "http://localhost/api",
};

// @ts-expect-error Deliberatley stub the newrelic object
global.newrelic = {
  noticeError: jest.fn(),
};

export const mockDefaultFeatures: { [id: string]: TREATMENTS } = {
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION]: TREATMENTS.ON,
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION_DEFINE_DIAGRAMS]: TREATMENTS.ON,
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION_LABEL_PREFERENCES]: TREATMENTS.ON,
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_DIAGRAM_LAYERS]: TREATMENTS.ON,
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_LOCKS]: TREATMENTS.ON,
  [FEATUREFLAGS.SURVEY_PLAN_GENERATION_PREVIEW_COMPILATION]: TREATMENTS.ON,
};

const mockFeatures = { ...mockDefaultFeatures };
jest.mock("./split-functionality/UseFeatureFlags", () => ({
  default: function (feature: FEATUREFLAGS): IFeatureToggleResult {
    return { result: mockFeatures[feature]?.valueOf() === "on", error: false, loading: false };
  },
  __esModule: true,
}));

export const setMockedSplitFeatures = (features: Record<string, string>): void => {
  Object.entries(features).forEach(([featureKey, featureValue]) => {
    mockFeatures[featureKey] = featureValue as TREATMENTS;
  });
};

// setup mocked responses from API requests
beforeAll(() =>
  server.listen({
    onUnhandledRequest: (req, print) => {
      if (req.url.includes("/generate-plans/")) {
        print.warning();
      } else return;
    },
  }),
);

beforeEach(() => {
  setupJestCanvasMock();
  setMockedSplitFeatures(mockDefaultFeatures);
});

expect.extend(mapAssertions.default);
expect.extend(mapFeatureAssertions.default);
expect.extend(coordinateMatchers);

// Reset any request handlers that we may add during the tests, so they don't
// affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
