// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, screen, waitFor, within } from "@storybook/testing-library";

import CompileImagesViewer from "@/components/PlanSheets/__tests__/CompileImagesViewer";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { sleep } from "@/test-utils/storybook-utils";

import { Default, Story } from "./PlanSheets.stories";

export default {
  parameters: {
    chromatic: { disable: true },
  },
  title: "CompilePlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

// Chromatic will execute the test in the order defined in the storybook
export const CompilePlans: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    indexedDB.deleteDatabase("compileImages");
    const canvas = within(canvasElement);
    fireEvent.click(await canvas.findByTitle("View labels"));
    fireEvent.click(await canvas.findByText("Parcel appellations")); // uncheck parcel appellations
    fireEvent.click(canvas.getByRole("button", { name: "OK" })); // save the changes
    await sleep(500);
    fireEvent.click(await canvas.findByText("Compile plan(s)"));
    const modal = await screen.findByRole("dialog");
    const modalText = /Complete Plan Generation/i;
    await expect(modal.textContent).toMatch(modalText);
    await sleep(500);
    try {
      fireEvent.click(await screen.findByText("Yes"));
    } catch (e) {
      // First run will not have the "Yes" button
    }

    await waitFor(
      async () => {
        await expect(canvas.getByText("Compile plan(s)")).toBeInTheDocument();
      },
      { timeout: 12000 },
    );
  },
};

// We dont need to run this test in chromatic
export const ViewAllCompiledImages: Story = {
  render: () => <CompileImagesViewer imageFilename="all" />,
  parameters: {
    chromatic: { disable: true },
  },
};

export const CompiledImageDSPT: Story = {
  parameters: {
    chromatic: {
      disableSnapshot: true, // TODO Disable snapshot for this story
    },
  },
  render: () => <CompileImagesViewer imageFilename="DSPT-1.jpg" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        await expect(canvas.getByText("Image name: DSPT-1.jpg")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const CompiledImageDTPS: Story = {
  parameters: {
    chromatic: {
      disableSnapshot: true, // TODO Disable snapshot for this story
    },
  },
  render: () => <CompileImagesViewer imageFilename="DTPS-1.jpg" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        await expect(canvas.getByText("Image name: DTPS-1.jpg")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};
