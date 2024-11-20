import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react/*";
import { within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { ModalStoryWrapper, StorybookRouter, TestCanvas } from "@/test-utils/storybook-utils";

import PlanSheets from "../PlanSheets";
import { PlanMode } from "../PlanSheetType";
import { diagramLabelObsBearingHide, diagramLabelParcelAppellation, pageLabelWithLineBreak } from "./data/customLabels";

export default {
  title: "PlanSheets/StackedLabels",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ModalStoryWrapper>
          <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
            <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
          </StorybookRouter>
        </ModalStoryWrapper>
      </Provider>
    </QueryClientProvider>
  );
};

const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].labels = [...(customMockPlanData.pages[0].labels ?? []), pageLabelWithLineBreak];
}
if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramLabelParcelAppellation,
    diagramLabelObsBearingHide,
  ];
}

const CustomLabels: Story = {
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

export const ClickOnPositionWithStackedLabels: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, PlanMode.SelectLabel);
    await test.leftClick([548, 417]); // top most object is selected
    await test.contextMenu({ at: [548, 417], select: "Select" }, "hover");
    await expect(await test.findMenuItem("Lot 123 Section 1")).toBeInTheDocument();
    await expect(await test.findMenuItem("1800°545'04\"")).toBeInTheDocument();
    await expect(await test.findMenuItem("My page label\nwith a line break")).toBeInTheDocument();
    // The following should be verified by chromatic:
    // select sub menu should show all stacked labels
    // top most label is highlighted as pink i.e. My page label with a line break
  },
};

export const HoveringOverStackedLabelsHighlightsCorrespondingLabel: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.leftClick([548, 417]); // select the label first
    await test.contextMenu({ at: [548, 417], select: "Select" }, "hover");
    // todo - hover over the label not working correctly after initial hover
    await test.user.hover(await test.findMenuItem("Lot 123 Section 1"));
    // The following should be verified by chromatic:
    // previously selected (highlighted in pink) label is deselected i.e. My page label with a line break
    // hovered label is selected (highlighted in pink) i.e. Lot 123 Section 1
  },
};

export const SelectLabelFromBottomOfStackedLabels: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.leftClick([548, 417]); // select the label first
    await test.contextMenu({ at: [548, 417], select: "Select" }, "hover");
    await test.user.click(await test.findMenuItem("Lot 123 Section 1")); // select the bottom most label
    // right-click on the same location now opens menu for selected label (bottom most label i.e. Lot 123 Section 1 is shift to top of stack)
    await test.rightClick([548, 417]);
    await test.contextMenu({ at: [548, 417], select: "Properties" });
    await test.waitForCytoscape();
    await expect(test.findProperty("TextInput", "Text angle (degrees)").getAttribute("value")).toBe("90.0000");
    // The following should be verified by chromatic:
    // Label at bottom of list (Lot 123 Section 1) is moved to top of stack and highlighted in pink
    // properties panel text confirms the selected label is Lot 123 Section 1
  },
};

export const ClickOnPositionWithoutStackedLabels: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.waitForCytoscape();
    await test.rightClick([523, 415]); // right-click on position without stacked labels
    const contextMenu = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    void expect(within(contextMenu).queryByText("Select")).not.toBeInTheDocument();
    // The following should be verified by chromatic:
    // context menu should not show select option if right-clicked on position without stacked labels
  },
};
