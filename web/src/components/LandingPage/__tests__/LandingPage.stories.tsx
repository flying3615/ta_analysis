import LandingPage from "../LandingPage";
import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { PlangenApp } from "@/App.tsx";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

type Story = StoryObj<typeof LandingPage>;
export const Default: Story = {
  render: () => (
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={["/plan-generation/12345"]}>
        <PlangenApp />
      </MemoryRouter>
    </FeatureFlagProvider>
  ),
};
