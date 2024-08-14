/**
 * Some of these errors in our jest tests are hard to fix and/or come from
 * external dependencies, so we supress them to provide better visibility over
 * the actual test output.
 */

const SUPPRESSED_ERRORS = [
  // jsdom noise from Lui - https://github.com/jsdom/jsdom/issues/2177
  /Error: Could not parse CSS stylesheet/,
  /Warning: An update to \S+ inside a test was not wrapped in act/,
];

const originalError = console.error;
console.error = (...args) => {
  !SUPPRESSED_ERRORS.find((s) => args.toString().match(s)) && originalError(...args);
};

const SUPPRESSED_WARNINGS = [
  /has unsupported style brokenSolid1 - will use solid/,
  /The style property `height: auto` is invalid/,
  /The style value of `label` is deprecated for `width`/,
];

const originalWarning = console.warn;
console.warn = (...args) => {
  !SUPPRESSED_WARNINGS.find((s) => args.toString().match(s)) && originalWarning(...args);
};

export {};
