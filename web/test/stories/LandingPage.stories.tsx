import { StoryFn, Meta } from "@storybook/react";
import LandingPage from "@components/LandingPage/LandingPage";

export default {
  title: "LandingPage",
  component: LandingPage,
} as Meta<typeof LandingPage>;

export const Default: StoryFn<typeof LandingPage> = () => <LandingPage />;
