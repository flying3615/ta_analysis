const config = {
  // Required
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // Optional
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-coverage",
    "@chromatic-com/storybook",
  ],
  staticDirs: [
    "../public",
    { from: "../public", to: "/plan-generation" },
    {
      from: "../src/mocks/data/geotiles",
      to: "/data/geotiles",
    },
  ],
  docs: {},
  features: {},
};

export default config;
