// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:testing-library/react",
    "plugin:prettier/recommended",
    "plugin:storybook/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "react-refresh", "jsx-a11y", "simple-import-sort"],
  ignorePatterns: [
    "jest.config.js",
    "config/",
    "react-app-env.d.ts",
    "node_modules/",
    "**/node_modules/",
    "/**/node_modules/*",
    "out/",
    "dist/",
    "build/",
    "allure-report/",
    "allure-results/",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // Default simple-import-sort rules
    "simple-import-sort/imports": "off",
    "simple-import-sort/exports": "off",

    "react/react-in-jsx-scope": "off",
    "linebreak-style": ["error", "unix"],
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "react/jsx-curly-brace-presence": "warn",
    "no-restricted-imports": [
      "warn",
      {
        patterns: [
          {
            group: ["**/../*"],
            message: "Please use an absolute import instead of a relative import - example: '@/path/to/component'",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        // eslint-disable-next-line no-undef
        tsconfigRootDir: __dirname,
      },
      extends: ["plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
          },
        ],
      },
    },
    {
      files: ["**/*.test.*", "**/*.stories.*", ".storybook/**"],
      rules: {
        "no-console": "off",
        "no-restricted-imports": [
          "warn",
          {
            patterns: [
              {
                group: ["**/../../*"],
                message: "Please use an absolute import instead of a relative import - example: '@/path/to/component'",
              },
            ],
          },
        ],
      },
    },
  ],
};
