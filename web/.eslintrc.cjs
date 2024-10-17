module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    "./node_modules/@linzjs/style/.eslintrc.cjs",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:jsx-a11y/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "plugin:storybook/recommended",
    "plugin:testing-library/react",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    extraFileExtensions: [".json"],
    // separate tsconfig that
    // extends tsconfig.json
    // _and_ references this configuration file
    project: "./tsconfig.eslint.json",
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: ["react", "react-refresh", "jsx-a11y"],
  rules: {
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
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
          },
        ],

        "jest/no-disabled-tests": "off", // should add a story ref

        // Tech Debt
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        eqeqeq: "off",
        "no-constant-binary-expression": "off",
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
                // __tests__ can use relative to first parent directory
                group: ["**/../../*"],
                message: "Please use an absolute import instead of a relative import - example: '@/path/to/component'",
              },
            ],
          },
        ],
      },
    },
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
