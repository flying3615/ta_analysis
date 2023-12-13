import { resolve as _resolve } from "path";
export const stories = ["../src/**/*.stories.@(js|jsx|ts|tsx)"];
export const addons = [
  "@storybook/addon-links",
  "@storybook/addon-essentials",
  "@storybook/addon-interactions"
];
export const framework = {
  name: "@storybook/react-vite",
  options: {},
};
export const features = {
  storyStoreV7: true,
};
export const staticDirs = ["../public", { from: "../public", to: "/plan-generation" }];
export async function viteFinal(config) {
  return {
    ...config,
  };
}
