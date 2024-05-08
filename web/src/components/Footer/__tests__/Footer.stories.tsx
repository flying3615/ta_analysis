import { Meta, StoryObj } from "@storybook/react";
import Footer from "../Footer";

export default {
  title: "Footer",
  component: Footer,
  argTypes: {
    content: {
      control: "text",
    },
  },
} as Meta<typeof Footer>;

export const Default: StoryObj<typeof Footer> = {
  render: (args) => (
    <div style={{ height: "100vh" }}>
      <Footer>{args.content}</Footer>
    </div>
  ),
  args: {
    content: "Footer Content",
  },
};
