import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { http, HttpResponse } from "msw";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import {
  diagramLabelLineDescription,
  diagramLabelLineLongDescriptionLinebreak,
  diagramLabelObsBearingHide,
  diagramLabelObsCode,
  diagramLabelParcelAppellation,
  diagramLabelSystemHide,
  pageLabelWithBorder,
} from "@/components/PlanSheets/properties/__tests__/data/LabelsData";
import {
  hiddenPageLine,
  userCoordinate1,
  userCoordinate2,
} from "@/components/PlanSheets/properties/__tests__/data/LineData";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { getCytoElement, sleep, TestCanvas } from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/ViewLabels",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].coordinates = [
    ...(customMockPlanData.pages[0].coordinates ?? []),
    userCoordinate1,
    userCoordinate2,
  ];
}
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].lines = [...(customMockPlanData.pages[0].lines ?? []), hiddenPageLine];
}
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].labels = [...(customMockPlanData.pages[0].labels ?? []), pageLabelWithBorder];
}
if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramLabelParcelAppellation,
    diagramLabelObsBearingHide,
    diagramLabelObsCode,
    diagramLabelSystemHide,
    diagramLabelLineDescription,
    diagramLabelLineLongDescriptionLinebreak,
  ];
}
// show object with disyplayState of hide as greyed out and don't show oject with displayState of systemHide
export const PlanSheetWithHiddenObject: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(customMockPlanData, {
            status: 200,
            statusText: "OK",
          }),
        ),
        ...handlers,
      ],
    },
  },
};

export const HideHiddenObject: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const visibilityIcon = await canvas.findByTitle("View hidden objects");
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_view"); // View Hidden Object icon togged on by default
    await userEvent.click(await canvas.findByTitle("View hidden objects"));
    await sleep(500); // final screenshot - chromatic will check for the absence of the hidden line and labels on screen
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_visiblity_off"); // View Hidden Object icon changed to off
  },
};

export const ShowHiddenObject: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const visibilityIcon = await canvas.findByTitle("View hidden objects");
    await userEvent.click(await canvas.findByTitle("View hidden objects")); // hide hidden object to turn on later
    await sleep(500);

    // state of “View hidden objects” button is not affected by activating select labels mode (any other selection mode)
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [213, 213] /* Page "Label 14" */, select: "Hide" });
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_visiblity_off"); // View Hidden Object icon remains off

    await userEvent.click(await canvas.findByTitle("View hidden objects"));
    await sleep(500); // final screenshot - chromatic will check that hidden line and labels are back on screen
    await expect(visibilityIcon).toHaveAttribute("data-icon", "ic_view"); // View Hidden Object icon changed to on
  },
};

export const ViewLabelsDefaultView: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("View labels"));
    await sleep(500);
    await expect(await canvas.findByText("View labels")).toBeInTheDocument();
    // verify default viewablity of labels
    const allCheckbox = canvas.getByRole("checkbox", { name: "All Indeterminate Check" });
    await expect(allCheckbox).toBeChecked(); // All checkbox is partially checked
    const markDescriptionsCheckbox = canvas.getByRole("checkbox", { name: "Mark descriptions Check" });
    await expect(markDescriptionsCheckbox).toBeChecked(); // Mark description checkbox is checked
    const markNamesCheckbox = canvas.getByRole("checkbox", { name: "Mark names Check" });
    await expect(markNamesCheckbox).toBeChecked(); // Mark names checkbox is checked
    const observationCodeCheckbox = canvas.getByRole("checkbox", { name: "Observation codes Check" });
    await expect(observationCodeCheckbox).not.toBeChecked(); // Observation code checkbox is not checked
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled(); // ok button disabled
    // chromatic to check the default view of all labels and styling
  },
};

export const ViewLabelsOK: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await (await TestCanvas.Create(canvasElement)).waitForCytoscape();

    //elements are removed form the graph data when they are not visible
    await expect(getCytoElement("#LAB_11")).toBeDefined(); // check hidden mark name label is visible
    await expect(getCytoElement("#LAB_13")).toBeDefined(); // check not-hidden mark name label is visible
    await expect(getCytoElement("#LAB_31")).not.toBeDefined(); // check observation code is not visible

    await userEvent.click(await canvas.findByTitle("View labels"));
    await sleep(500);
    await expect(await canvas.findByText("View labels")).toBeInTheDocument();
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled(); // OK button should be disabled as not changes have been made

    const observationCodeCheckbox = canvas.getByRole("checkbox", { name: /observation codes/i });
    const markNamesCheckbox = canvas.getByRole("checkbox", { name: /mark names/i });
    await userEvent.click(observationCodeCheckbox);
    await userEvent.click(markNamesCheckbox);
    await expect(okButton).toBeEnabled(); // OK button should be enabled now that we've made changes

    await userEvent.click(okButton);
    await sleep(500);

    await expect(getCytoElement("#LAB_11")).not.toBeDefined(); // check hidden mark name label is now not visible
    await expect(getCytoElement("#LAB_13")).not.toBeDefined(); // check not-hidden mark name label is now not visible
    await expect(getCytoElement("#LAB_31")).toBeDefined(); // check observation code is now visible
    // chromatic will verify observation code is visible and mark names are not
  },
};

export const ViewLabelsCancel: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await (await TestCanvas.Create(canvasElement)).waitForCytoscape();
    await sleep(500);

    //elements are removed form the graph data when they are not visible
    await expect(getCytoElement("#LAB_11")).toBeDefined(); //check mark name label is visible
    await expect(getCytoElement("#LAB_31")).not.toBeDefined(); //check observation code is not visible

    await userEvent.click(await canvas.findByTitle("View labels"));
    await sleep(500);
    await expect(await canvas.findByText("View labels")).toBeInTheDocument();
    const cancelButton = canvas.getByText("Cancel");
    let observationCodeCheckbox = canvas.getByRole("checkbox", { name: /observation codes/i });
    let markNamesCheckbox = canvas.getByRole("checkbox", { name: /mark names/i });

    await userEvent.click(observationCodeCheckbox);
    await userEvent.click(markNamesCheckbox);
    await expect(observationCodeCheckbox).toBeChecked(); // Observation code checkbox is now checked
    await expect(markNamesCheckbox).not.toBeChecked(); // Mark names checkbox is now not checked

    await userEvent.click(cancelButton); // cancel the changes
    await sleep(500);

    await expect(getCytoElement("#LAB_11")).toBeDefined(); //check mark name label is still visible
    await expect(getCytoElement("#LAB_31")).not.toBeDefined(); //check observation code is still not visible

    await userEvent.click(await canvas.findByTitle("View labels")); // open the view labels dialog again
    await sleep(500);
    observationCodeCheckbox = canvas.getByRole("checkbox", { name: /observation codes/i });
    markNamesCheckbox = canvas.getByRole("checkbox", { name: /mark names/i });
    await expect(observationCodeCheckbox).not.toBeChecked(); // verify change not saved
    await expect(markNamesCheckbox).toBeChecked(); // verify change not saved
    // chromatic will verify button not selected with correct styling
    // chromatic will verify the changes are not saved (observation code is not visible and mark names are on cytoscape)
  },
};

export const WaterBoundaryLineLabels: Story = {
  ...PlanSheetWithHiddenObject,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await (await TestCanvas.Create(canvasElement)).waitForCytoscape();

    await expect(getCytoElement("#LAB_50")).toBeDefined(); // lineDescription label is visible
    await expect(getCytoElement("#LAB_51")).toBeDefined(); // lineLongDescription label is visible

    // check that ~r in editedText was correctly replaced with \n
    const lineLongDescriptionLabel = getCytoElement("#LAB_51");
    await expect(lineLongDescriptionLabel?.data("label")).toBe(
      "Boundary follows\ncentre-line\nof stream/river\nSome physycal description",
    );

    await userEvent.click(await canvas.findByTitle("View labels"));
    await sleep(500);
    await expect(await canvas.findByText("View labels")).toBeInTheDocument();
    const waterBoundaryCheckbox = canvas.getByRole("checkbox", { name: /Water\/irregular boundary/i });
    await expect(waterBoundaryCheckbox).toBeChecked();

    await userEvent.click(waterBoundaryCheckbox);
    await expect(waterBoundaryCheckbox).not.toBeChecked();

    const okButton = canvas.getByRole("button", { name: "OK" });
    await userEvent.click(okButton);
    await sleep(500);

    await expect(getCytoElement("#LAB_50")).not.toBeDefined(); // lineDescription label is not visible
    await expect(getCytoElement("#LAB_51")).not.toBeDefined(); // lineLongDescription label is not visible
  },
};
