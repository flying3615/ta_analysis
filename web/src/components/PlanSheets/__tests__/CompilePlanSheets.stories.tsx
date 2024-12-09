// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, screen, waitFor, within } from "@storybook/testing-library";

import CompileImagesViewer from "@/components/PlanSheets/__tests__/CompileImagesViewer";
import { Default, PlanSheetsTemplate, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { clearCompileImages } from "@/test-utils/compile-images-utils";
import { sleep } from "@/test-utils/storybook-utils";

export default {
  title: "CompilePlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const CompileIt = (fileName: string, snapShot = true): Story => ({
  ...Default,
  beforeEach: async () => {
    await clearCompileImages();
    return clearCompileImages;
  },
  render: () => <CompileImagesViewer imageFilename={fileName} planSheetsTemplate={PlanSheetsTemplate()} />,
  parameters: {
    chromatic: {
      viewports: [800],
      disableSnapshot: snapShot,
    },
    viewport: {
      viewports: 800,
      defaultViewport: 800,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        await expect(canvas.getByText("Compile plan(s)")).toBeInTheDocument();
      },
      { timeout: 12000 },
    );
    fireEvent.click(await canvas.findByTitle("View labels"));
    fireEvent.click(await canvas.findByText("Parcel appellations")); // uncheck parcel appellations
    fireEvent.click(canvas.getByRole("button", { name: "OK" })); // save the changes
    await sleep(500);
    fireEvent.click(await canvas.findByText("Compile plan(s)"));
    const modal = await screen.findByRole("dialog");
    const modalText = /Complete Plan Generation/i;
    await expect(modal.textContent).toMatch(modalText);
    fireEvent.click(await waitFor(async () => await screen.findByText("Yes")));

    await waitFor(
      async () => {
        await expect(canvas.getByText("Compile plan(s)")).toBeInTheDocument();
      },
      { timeout: 18000 },
    );
    fireEvent.click(await screen.findByText("Refresh it"));
    await waitFor(
      async () => {
        await expect(canvas.getAllByText(`Image name: `, { exact: false })[0]).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
});

export const CompiledImageDSPT = CompileIt("DSPT-1.jpg");
export const CompiledImageDTPS = CompileIt("DTPS-1.jpg");
export const ViewAllCompiledImages = CompileIt("all");
