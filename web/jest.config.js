module.exports = {
  roots: ["<rootDir>/test"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
  testMatch: ["<rootDir>/test/**/*.{spec,test}.{js,jsx,ts,tsx}"],
  transform: {
    "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": "<rootDir>/config/jest/babelTransform.js",
    "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js",
  },
  resetMocks: true,
  coverageReporters: ["text", "cobertura"],

  // When adding mappings here, make sure to also add them in tsconfig.json & .storybook/main.js
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
  },
};
