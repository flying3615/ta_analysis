import { Meta, StoryObj } from "@storybook/react";
import CytoscapeCanvas from "../CytoscapeCanvas";

export default {
  title: "CytoscapeCanvas",
  component: CytoscapeCanvas,
} as Meta<typeof CytoscapeCanvas>;

type Story = StoryObj<typeof CytoscapeCanvas>;

export const Default: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas />
    </div>
  ),
};
