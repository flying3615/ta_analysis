import { Meta, StoryObj } from "@storybook/react";
import SidePanel, { SidePanelProps } from "../SidePanel";

export default {
  title: "SidePanel",
  component: SidePanel,
  argTypes: {
    align: {
      options: ["left", "right"],
    },
    isOpen: {
      control: "boolean",
    },
    children: {
      control: "text",
    },
  },
} as Meta<typeof SidePanel>;

type Story = StoryObj<typeof SidePanel>;

const Template = (props: SidePanelProps) => {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <div style={{ width: "100%", padding: "2rem" }}>
        <h4>Main Content</h4>
      </div>
      <SidePanel align={props.align} isOpen={props.isOpen}>
        <strong>{props.children}</strong>
      </SidePanel>
    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    align: "left",
    isOpen: true,
    children: "Side Panel Content",
  },
};

export const Closed: Story = {
  render: Template,
  args: {
    align: "left",
    isOpen: false,
    children: "Side Panel Content",
  },
};

export const RightAligned: Story = {
  render: Template,
  args: {
    align: "right",
    isOpen: true,
    children: "Side Panel Content",
  },
};
