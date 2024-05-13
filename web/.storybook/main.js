const config = {
  // Required
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // Optional
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook"
  ],
  staticDirs:  ["../public", { from: "../public", to: "/plan-generation" }],
  docs: {
    autodocs: false,
  },
  features: { },
};

export default config;
