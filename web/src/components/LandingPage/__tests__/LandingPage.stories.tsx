import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { StorybookRouter } from "@/test-utils/storybook-utils";

import LandingPage from "../LandingPage";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

const queryClient = new QueryClient();

type Story = StoryObj<typeof LandingPage>;
export const Default: Story = {
  render: () => (
    <FeatureFlagProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <StorybookRouter url={generatePath(Paths.root, { transactionId: "12345" })}>
            <Route path={Paths.root} element={<LandingPage />} />
          </StorybookRouter>
        </QueryClientProvider>
      </Provider>
    </FeatureFlagProvider>
  ),
};
