// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { fireEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { Paths } from "@/Paths";
import { store } from "@/redux/store.ts";
import { sleep, StorybookRouter } from "@/test-utils/storybook-utils";

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
        <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
          <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
        </StorybookRouter>
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

export const SystemGeneratedPrimaryDiagram: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(planData("sysGenPrimaryDiag"), { status: 200, statusText: "OK" }),
        ),
      ],
    },
  },
};

export const SystemGeneratedSurveyDiagram: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(planData("sysGenTraverseDiag"), { status: 200, statusText: "OK" }),
        ),
      ],
    },
  },
};
SystemGeneratedSurveyDiagram.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(await canvas.findByTitle("Change sheet view"));
  await sleep(1000);
  await userEvent.click(await canvas.findByText("Survey sheet"));
};

export const SystemGeneratedNonPrimaryDiagram: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(planData("sysGenNonPrimaryDiag"), { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};

const planData = (
  diagramType: "sysGenTraverseDiag" | "sysGenPrimaryDiag" | "sysGenNonPrimaryDiag" = "sysGenPrimaryDiag",
) => {
  const diagramDescription = {
    sysGenPrimaryDiag: "System Generated Primary Diagram",
    sysGenNonPrimaryDiag: "System Generated Non Primary Diagram",
    sysGenTraverseDiag: "System Generated Traverse Diagram",
  };

  return new PlanDataBuilder()
    .addDiagram(
      {
        x: 80,
        y: -90,
      },
      undefined,
      diagramType,
    )
    .addCooordinate(10001, {
      x: 20,
      y: -10,
    })
    .addCooordinate(10002, {
      x: 50,
      y: -50,
    })
    .addCooordinate(10003, {
      x: 20,
      y: -60,
    })
    .addCooordinate(10004, {
      x: 10,
      y: -10,
    })
    .addLine(1001, [10001, 10002], 1.75, "observation", "solid")
    .addLine(1002, [10002, 10003], 1.75, "observation", "solid")
    .addLine(1003, [10003, 10004], 1.75, "observation", "solid")
    .addLine(1004, [10004, 10001], 1.75, "observation", "solid")
    .addLabel(
      "labels",
      1,
      diagramDescription[diagramType],
      { x: 50, y: -5 },
      undefined,
      undefined,
      "diagram",
      "Tahoma",
      14.0,
    )
    .build();
};
