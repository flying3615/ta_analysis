// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/jest-globals";
import "@testing-library/jest-dom";
import "jest-canvas-mock";
import { setupJestCanvasMock } from "jest-canvas-mock";
import { configure } from "@testing-library/react";
import { mapAssertions, mapFeatureAssertions } from "@linzjs/landonline-openlayers-map";
import { server } from "@/mocks/mockServer";

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
};

// setup mocked responses from API requests
beforeAll(() => server.listen());

beforeEach(() => {
  setupJestCanvasMock();
});

expect.extend(mapAssertions.default);
expect.extend(mapFeatureAssertions.default);

// Reset any request handlers that we may add during the tests, so they don't
// affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
