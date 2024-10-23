import ResizeObserver from "resize-observer-polyfill";
import { TextEncoder } from "util";

global.ResizeObserver = ResizeObserver;
global.TextEncoder = TextEncoder;

// If this method is not stubbed, it can prevent `setupTests.tsx` from loading
// So we configure this in `jest.config.js` to run before setup
global.URL.createObjectURL = jest.fn();
