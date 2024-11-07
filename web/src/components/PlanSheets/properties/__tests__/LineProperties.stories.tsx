import { DisplayStateEnum, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import {
  multipleSegmentPageLineArrowHead,
  userCoordinate1,
  userCoordinate2,
} from "@/components/PlanSheets/properties/__tests__/data/LineData";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  clickAtCoordinates,
  getCytoCanvas,
  getCytoscapeNodeLayer,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
  tabletLandscapeParameters,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/Properties/LinePropertiesPanel",
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

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};
const checkCytoElementProperties = async (selector: string) => {
  const element = window.cyRef.$(selector);
  if (element.length > 0) {
    const data = element.data() as INodeDataProperties;
    await expect(data.displayState).toBe(DisplayStateEnum.hide);
  } else {
    console.log(`Element with ID ${selector} not found.`);
  }
};
export const ShowLineMenu: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [520, 135], RIGHT_MOUSE_BUTTON);
    await sleep(500);
  },
};
export const ShowDiagramLineMenuProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [520, 135], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
  },
};
/**
 * Story to hide a line through the line properties panel and verify that it actually got hidden.
 */
export const ShowHideDiagramLineFromProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    clickAtCoordinates(getCytoscapeNodeLayer(cytoscapeElement), [520, 135], RIGHT_MOUSE_BUTTON);
    await sleep(500);

    const menuProperties = await canvas.findByText("Properties");
    await userEvent.click(menuProperties);
    await sleep(500);

    await userEvent.click(await canvas.findByLabelText("Hide"));
    await sleep(500);
    await userEvent.click(await canvas.findByText("OK"));
    await sleep(500);

    await checkCytoElementProperties("#1001_0");
    await sleep(500);
  },
};
export const ShowPageLineMenuProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [785, 289], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
  },
};
export const UpdatePageLineProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [785, 289], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const dashStyleRadioButton = canvas.getByRole("radio", { name: "peck1" });
    await userEvent.click(dashStyleRadioButton);
    const thickness2RadioButton = canvas.getByRole("radio", { name: "2.0" });
    await userEvent.click(thickness2RadioButton);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeEnabled();
  },
};

export const UpdateLinePropertiesCancelFlow: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [785, 289], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const dashStyleRadioButton = canvas.getByRole("radio", { name: "peck1" });
    await userEvent.click(dashStyleRadioButton);
    const thickness2RadioButton = canvas.getByRole("radio", { name: "2.0" });
    await userEvent.click(thickness2RadioButton);
    await expect(okButton).toBeEnabled();
    const cancelButton = canvas.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButton); // final screenshot verify changes not rendered
    await sleep(500);
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeDisabled();
  },
};

export const UpdatePageLinePropertiesThenUndo: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [785, 289], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    const dashStyleRadioButton = canvas.getByRole("radio", { name: "peck1" });
    await userEvent.click(dashStyleRadioButton);
    await userEvent.click(okButton);
    await sleep(500);
    await userEvent.click(await canvas.findByRole("button", { name: "Undo" })); // final screenshot verify changes undone
    await sleep(500);
  },
};

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].coordinates = [
    ...(customMockPlanData.pages[0].coordinates ?? []),
    userCoordinate1,
    userCoordinate2,
  ];
}
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].lines = [...(customMockPlanData.pages[0].lines ?? []), multipleSegmentPageLineArrowHead];
}

export const HoverOverMultipleSegmentPageLineWithArrowHead: Story = {
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
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTitle("Select Lines"));
    await sleep(500);
    const target = getCytoCanvas(await within(canvasElement).findByTestId("MainCytoscapeCanvas"));
    await userEvent.pointer({ target: target, coords: { clientX: 746, clientY: 173 } }); // line turns blue
  },
};
