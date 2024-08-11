// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { IPagePageTypeEnum } from "@linz/survey-plan-generation-api-client/src/models/IPage.ts";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { Paths } from "@/Paths";
import { replaceDiagrams } from "@/redux/planSheets/planSheetsSlice";
import { store } from "@/redux/store.ts";
import { ModalStoryWrapper, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

import PlanSheets from "../PlanSheets";

export default {
  title: "PlanSheets",
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
            <Route path={Paths.defineDiagrams} element={<span>Define Diagrams Dummy Page</span>} />
          </StorybookRouter>
        </ModalStoryWrapper>
      </Provider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const SmallViewport: Story = {
  ...Default,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const DiagramsPanelClosed: Story = {
  ...SmallViewport,
};
DiagramsPanelClosed.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // Use fireEvent to get around known issue in testing-library
  // https://github.com/storybookjs/storybook/issues/26888
  // https://github.com/testing-library/user-event/issues/1075#issuecomment-1948093169
  fireEvent.click(await canvas.findByTitle("Toggle diagrams panel"));
  await sleep(2000);
  expect(canvas.queryByRole("heading", { name: "Survey sheet diagrams" })).toBeNull();
};

export const TitlePage1: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () => {
          const pd = planData();
          console.log(`Fetched planData ${JSON.stringify(pd)}`);
          return HttpResponse.json(pd, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};

export const SurveyPage1: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () => HttpResponse.json(planData(), { status: 200, statusText: "OK" })),
      ],
    },
  },
};
SurveyPage1.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(await canvas.findByTitle("Change sheet view"));
  await sleep(1000);
  await userEvent.click(await canvas.findByText("Survey sheet"));
};

export const SurveyPage2: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(planData(), { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};

export const UnsavedChangesModal: Story = {
  ...Default,
};
UnsavedChangesModal.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  expect(await canvas.findByText("Save layout")).toBeInTheDocument();

  // Dispatch replace diagrams event to set hasChanges = true
  store.dispatch(replaceDiagrams([]));
  await sleep(500);

  await userEvent.click(await canvas.findByText("Sheets"));
  await userEvent.click(await canvas.findByText("Define Diagrams"));
  await sleep(500);
};

const planData = () => {
  const builder = new PlanDataBuilder()
    .addDiagram({
      bottomRightPoint: {
        x: 78,
        y: -53,
      },
      originPageOffset: {
        x: 0,
        y: 0,
      },
      diagramType: "sysGenPrimaryDiag",
      pageRef: 1,
      zoomScale: 200, // meter per cm
    })
    .addCooordinate(10001, {
      x: 0,
      y: 0,
    })
    .addCooordinate(10002, {
      x: 78,
      y: 0,
    })
    .addCooordinate(10003, {
      x: 78,
      y: -53,
    })
    .addCooordinate(10004, {
      x: 0,
      y: -53,
    })
    .addLine(1001, [10001, 10002], 1.75, "observation", "solid")
    .addLine(1002, [10002, 10003], 1.75, "observation", "solid")
    .addLine(1003, [10003, 10004], 1.75, "observation", "solid")
    .addLine(1004, [10004, 10001], 1.75, "observation", "solid")
    .addLabel(
      "coordinateLabels",
      100,
      "System Generated Primary Diagram",
      { x: 40, y: -5 },
      undefined,
      undefined,
      "diagram",
      "Tahoma",
      14.0,
    )
    .addDiagram({
      bottomRightPoint: {
        x: 78,
        y: -53,
      },
      originPageOffset: {
        x: 0,
        y: 0,
      },
      diagramType: "sysGenTraverseDiag",
      pageRef: 2,
      zoomScale: 200,
    })
    .addCooordinate(20001, {
      x: 0,
      y: 0,
    })
    .addCooordinate(20002, {
      x: 78,
      y: 0,
    })
    .addCooordinate(20003, {
      x: 78,
      y: -53,
    })
    .addCooordinate(20004, {
      x: 0,
      y: -53,
    })
    .addLine(2001, [20001, 20002], 1.75, "observation", "solid")
    .addLine(2002, [20002, 20003], 1.75, "observation", "solid")
    .addLine(2003, [20003, 20004], 1.75, "observation", "solid")
    .addLine(2004, [20004, 20001], 1.75, "observation", "solid")
    .addLabel(
      "coordinateLabels",
      200,
      "System Generated Traverse Diagram",
      { x: 40, y: -5 },
      undefined,
      undefined,
      "diagram",
      "Tahoma",
      14.0,
    )
    .addDiagram({
      bottomRightPoint: {
        x: 78,
        y: -53,
      },
      originPageOffset: {
        x: 0,
        y: -0,
      },
      diagramType: "usrDefnPrimaryDiag",
      pageRef: 3,
      zoomScale: 400,
    })
    .addCooordinate(30001, {
      x: 0,
      y: 0,
    })
    .addCooordinate(30002, {
      x: 78,
      y: 0,
    })
    .addCooordinate(30003, {
      x: 78,
      y: -53,
    })
    .addCooordinate(30004, {
      x: 0,
      y: -53,
    })
    .addLine(3001, [30001, 30002], 1.75, "observation", "solid")
    .addLine(3002, [30002, 30003], 1.75, "observation", "solid")
    .addLine(3003, [30003, 30004], 1.75, "observation", "solid")
    .addLine(3004, [30004, 30001], 1.75, "observation", "solid")
    .addLabel(
      "coordinateLabels",
      300,
      "User defined A",
      { x: 40, y: -5 },
      undefined,
      undefined,
      "diagram",
      "Tahoma",
      14.0,
    )
    .addDiagram({
      bottomRightPoint: {
        x: 78,
        y: -53,
      },
      originPageOffset: {
        x: 40.5 / 200.0,
        y: -28.2 / 200.0,
      },
      diagramType: "usrDefnPrimaryDiag",
      pageRef: 3,
      zoomScale: 400,
    })
    .addCooordinate(40001, {
      x: 0,
      y: 0,
    })
    .addCooordinate(40002, {
      x: 78,
      y: 0,
    })
    .addCooordinate(40003, {
      x: 78,
      y: -53,
    })
    .addCooordinate(40004, {
      x: 0,
      y: -53,
    })
    .addLine(4001, [40001, 40002], 1.75, "observation", "solid")
    .addLine(4002, [40002, 40003], 1.75, "observation", "solid")
    .addLine(4003, [40003, 40004], 1.75, "observation", "solid")
    .addLine(4004, [40004, 40001], 1.75, "observation", "solid")
    .addLabel(
      "coordinateLabels",
      400,
      "User defined B",
      { x: 40, y: -5 },
      undefined,
      undefined,
      "diagram",
      "Tahoma",
      14.0,
    )
    .addPage({ id: 1, pageType: IPagePageTypeEnum.title, pageNumber: 1 })
    .addPage({ id: 2, pageType: IPagePageTypeEnum.survey, pageNumber: 1 })
    .addPage({ id: 3, pageType: IPagePageTypeEnum.survey, pageNumber: 2 });

  return builder.build();
};
