import { Meta, StoryFn } from "@storybook/react";
import CytoscapeCanvas from "../CytoscapeCanvas";

export default {
  title: "CytoscapeCanvas",
  component: CytoscapeCanvas,
} as Meta<typeof CytoscapeCanvas>;

export const Default: StoryFn<typeof CytoscapeCanvas> = () => {
  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas />
    </div>
  );
};
