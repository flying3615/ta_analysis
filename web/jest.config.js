module.exports = {
  roots: ["<rootDir>/src"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
  setupFiles: ["react-app-polyfill/jsdom", "<rootDir>/src/jest.polyfills.ts", "<rootDir>/src/hide-console-errors.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testMatch: ["<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"],
  testEnvironment: "allure-jest/jsdom",
  testEnvironmentOptions: {
    resultsDir: "./allure-results",
  },
  resolver: "<rootDir>/config/jest/resolver.js",
  transform: {
    "\\.(js|jsx|mjs|cjs|ts|tsx)$": "<rootDir>/config/jest/babelTransform.js",
    "\\.(scss|css)$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(ol|lodash-es|@linzjs/windows/|@linzjs/lui/|@fontsource|@linzjs/step-ag-grid))",
  ],
  coverageReporters: ["text", "cobertura"],
  moduleNameMapper: {
    "^@/(.*)\\.svg\\?(.*)": "<rootDir>/src/$1.svg",
    "^@/workers/previewWorker\\?worker$": "<rootDir>/src/workers/__mocks__/previewWorker.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
