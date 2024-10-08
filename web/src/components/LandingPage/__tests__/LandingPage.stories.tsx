import { Meta, StoryObj } from "@storybook/react";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { StorybookRouter } from "@/test-utils/storybook-utils";

import LandingPage from "../LandingPage";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

type Story = StoryObj<typeof LandingPage>;
export const Default: Story = {
  render: () => (
    <FeatureFlagProvider>
      <Provider store={store}>
        <StorybookRouter url={generatePath(Paths.root, { transactionId: "12345" })}>
          <Route path={Paths.root} element={<LandingPage />} />
        </StorybookRouter>
      </Provider>
    </FeatureFlagProvider>
  ),
};
