// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "jest-canvas-mock";
import { setupJestCanvasMock } from "jest-canvas-mock";
import { configure } from "@testing-library/react";

// It is critical that asyncUtilTimeout be lower than jest.setTimeout, or all the detail of an async assertion failure
// will be lost due to the test failing because of the overall timeout instead.
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(10000);

window._env_ = {
  splitKey: "localhost",
  oidcIssuerUri: "https://auth.dev.landonline.govt.nz/realms/landonline",
  authzBaseUrl: "https://dummy.authz.url",
  basemapApiKey: "dummy",
};

window.URL.createObjectURL = jest.fn(() => "");
beforeEach(() => {
  window.URL.createObjectURL = jest.fn(() => "");

  setupJestCanvasMock();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { mapAssertions, mapFeatureAssertions } = require("@linzjs/landonline-openlayers-map");

  expect.extend(mapAssertions.default);
  expect.extend(mapFeatureAssertions.default);
});

global.ResizeObserver = require("resize-observer-polyfill");
