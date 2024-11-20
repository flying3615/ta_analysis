import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { Meta } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { http, HttpResponse } from "msw";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import {
  clickAtCoordinates,
  getCytoscapeNodeLayer,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
} from "@/test-utils/storybook-utils";

import { diagramObsBearingLabel, diagramObsDistLabel } from "./data/customLabels";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;

if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramObsBearingLabel,
    diagramObsDistLabel,
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

export const RestoreDiagramLabelOriginalLocation: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoCanvas = getCytoscapeNodeLayer(cytoscapeElement);

    const label1Pos = { clientX: 666, clientY: 131 };
    await selectAndDrag(cytoCanvas, label1Pos, { clientX: label1Pos.clientX + 200, clientY: label1Pos.clientY + 200 });
    await sleep(1500);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      [label1Pos.clientX + 200, label1Pos.clientY + 200],
      RIGHT_MOUSE_BUTTON,
    );
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};
