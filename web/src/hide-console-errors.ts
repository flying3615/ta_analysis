/**
 * Some of these errors in our jest tests are hard to fix and/or come from
 * external dependencies, so we supress them to provide better visibility over
 * the actual test output.
 */

const SUPPRESSED_ERRORS = [
  // jsdom noise from Lui - https://github.com/jsdom/jsdom/issues/2177
  "Error: Could not parse CSS stylesheet",
];

const originalError = console.error;
console.error = (...args) => {
  !SUPPRESSED_ERRORS.find((s) => args.toString().includes(s)) && originalError(...args);
};

export {};
