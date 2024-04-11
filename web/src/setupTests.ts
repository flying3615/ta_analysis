// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { configure } from "@testing-library/react";

// It is critical that asyncUtilTimeout be lower than jest.setTimeout, or all the detail of an async assertion failure
// will be lost due to the test failing because of the overall timeout instead.
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(10000);
