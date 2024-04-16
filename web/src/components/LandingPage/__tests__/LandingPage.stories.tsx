import LandingPage from "../LandingPage";
import { Meta, StoryFn } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { PlangenApp } from "@/App.tsx";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

export const Default: StoryFn<typeof LandingPage> = () => {
  return (
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={["/plan-generation/"]}>
        <PlangenApp />
      </MemoryRouter>
    </FeatureFlagProvider>
  );
};
