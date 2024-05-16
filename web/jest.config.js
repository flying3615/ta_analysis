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
  transform: {
    "\\.(js|jsx|mjs|cjs|ts|tsx)$": "<rootDir>/config/jest/babelTransform.js",
    "\\.(scss|css)$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(ol))",
  ],
  resetMocks: true,
  coverageReporters: ["text", "cobertura"],
  moduleNameMapper: {
    "^@/(.*)\\.svg\?(.*)": "<rootDir>/src/$1.svg",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
