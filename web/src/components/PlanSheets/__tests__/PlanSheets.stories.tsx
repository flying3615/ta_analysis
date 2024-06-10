import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import PlanSheets from "../PlanSheets";
import { MemoryRouter } from "react-router-dom";
import { userEvent, within } from "@storybook/testing-library";
import { sleep } from "@/test-utils/storybook-utils";

// react-menu styles
import "@szhsin/react-menu/dist/index.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store.ts";
import { Route, Routes } from "react-router";
import { rest } from "msw";
import { PlanDataBuilder } from "@/mocks/data/PlanDataBuilder";
import { fireEvent } from "@storybook/testing-library";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const PlanSheetsTemplate = () => {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={["/plan-generation/layout-plan-sheets/123"]}>
        <Routes>
          <Route path="/plan-generation/layout-plan-sheets/:transactionId" element={<PlanSheets />}></Route>
        </Routes>
      </MemoryRouter>
    </Provider>
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
        rest.get(/\/plan\/123$/, (_, res, ctx) => {
          return res(ctx.status(200, "OK"), ctx.json(planData("sysGenPrimaryDiag")));
        }),
      ],
    },
  },
};

export const SystemGeneratedSurveyDiagram: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        rest.get(/\/plan\/123$/, (_, res, ctx) => {
          return res(ctx.status(200, "OK"), ctx.json(planData("sysGenTraverseDiag")));
        }),
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
        rest.get(/\/plan\/123$/, (_, res, ctx) => {
          return res(ctx.status(200, "OK"), ctx.json(planData("sysGenNonPrimaryDiag")));
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
