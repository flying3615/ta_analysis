import LandingPage from "@components/LandingPage/LandingPage";
import { Meta, StoryFn } from "@storybook/react";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

export const Default: StoryFn<typeof LandingPage> = () => <LandingPage />;
