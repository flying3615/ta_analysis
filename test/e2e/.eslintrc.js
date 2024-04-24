let extend = require("@linzjs/style/.eslintrc.cjs");

extend.extends.push("plugin:playwright/playwright-test");
extend.rules = {
  ...extend.rules,
  ...{
    "lines-between-class-members": [
      "error",
      { enforce: [{ blankLine: "always", prev: "method", next: "method" }] },
    ],
    "playwright/missing-playwright-await": "warn",
    "playwright/no-page-pause": "warn",
    "playwright/no-element-handle": "off",
    "playwright/no-eval": "off",
    "playwright/no-focused-test": "warn",
    "playwright/no-skipped-test": "off",
    "playwright/no-wait-for-timeout": "off",
    "playwright/no-force-option": "off",
    "playwright/max-nested-describe": "off",
    "playwright/no-conditional-in-test": "off",
    "playwright/no-useless-not": "off",
    "playwright/no-restricted-matchers": "off",
    "playwright/prefer-lowercase-title": "off",
    "playwright/prefer-to-have-length": "off",
    "playwright/require-top-level-describe": "error",
    "playwright/valid-expect": "off",
    "playwright/expect-expect": "off",
    "playwright/no-networkidle": "off",
    "playwright/no-wait-for-selector": "off",
  },
};
extend.ignorePatterns = ["test-results/*", "output/*"];

module.exports = extend;
