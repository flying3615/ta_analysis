// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { PageDTOPageTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, screen, userEvent, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo.ts";
import { Paths } from "@/Paths";
import { replaceDiagrams, updatePages } from "@/redux/planSheets/planSheetsSlice";
import { store } from "@/redux/store.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { ModalStoryWrapper, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LuiModalAsyncContextProvider>
        <FeatureFlagProvider>
          <Provider store={store}>
            <ModalStoryWrapper>
              <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
                <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
                <Route path={Paths.defineDiagrams} element={<span>Define Diagrams Dummy Page</span>} />
              </StorybookRouter>
            </ModalStoryWrapper>
          </Provider>
        </FeatureFlagProvider>
      </LuiModalAsyncContextProvider>
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
        http.get(/\/api\/survey\/123\/survey-info/, async () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
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
        http.get(/\/api\/survey\/123\/survey-info/, async () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
        }),
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
        http.get(/\/api\/survey\/123\/survey-info/, async () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
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

  await expect(await canvas.findByText("Save layout")).toBeInTheDocument();

  // Dispatch replace diagrams event to set hasChanges = true
  store.dispatch(replaceDiagrams([]));
  await sleep(500);

  await userEvent.click(await canvas.findByText("Sheets"));
  await userEvent.click(await canvas.findByText("Define Diagrams"));
  await sleep(500);
};

export const RenumberPage: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByTitle("Renumber page")).toBeInTheDocument();
    await sleep(500);

    await userEvent.click(await canvas.findByTitle("Renumber page"));
    await sleep(500);
    const modal = await screen.findByRole("dialog");
    const inputField = within(modal).getByPlaceholderText("Enter page number");

    if (inputField) {
      fireEvent.blur(inputField, { target: { value: 2 } });
    } else {
      throw new Error('Input field with placeholder "Enter page number" not found');
    }
  },
};

export const DeletePage: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByTitle("Delete page")).toBeInTheDocument();
    await sleep(500);
    await userEvent.click(await canvas.findByTitle("Delete page"));
    await sleep(500);
    const modal = await screen.findByRole("dialog");
    const proceedBtn = await within(modal).findByTitle("Proceed delete");
    if (proceedBtn) {
      await userEvent.click(proceedBtn);
      await canvas.findAllByTitle("1 of 1 rows selected").then((selectedRows) => {
        if (selectedRows.length === 2) {
          console.log('Found 2 elements with the title "1 of 1 rows selected".');
        } else {
          throw new Error(`Expected 2 elements, but found ${selectedRows.length}.`);
        }
      });
    } else {
      throw new Error('Button "Delete page" not found');
    }
  },
};

export const NoPageFound: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await sleep(500);
    store.dispatch(updatePages([]));
    await expect(await canvas.findByText("Add new page")).toBeInTheDocument();
  },
};

export const PlanNotFoundErrorModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json(
            {
              refreshRequired: false,
              code: "NOT_FOUND",
              message: "Could not find a CPL survey with ID 999",
              errors: [],
            },
            { status: 404, statusText: "Not Found" },
          ),
        ),
      ],
    },
  },
};

export const PlanIsLockedErrorModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json(
            {
              refreshRequired: false,
              code: "LOCKED",
              message:
                "The survey 123 is locked for Plan Generation. Go back on capture app and reopen the Plan Generation",
              errors: [],
            },
            { status: 423, statusText: "Not Found" },
          ),
        ),
      ],
    },
  },
};

const planData = () => {
  return new PlanDataBuilder()
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
    .addPage({ id: 1, pageType: PageDTOPageTypeEnum.title, pageNumber: 1 })
    .addPage({ id: 2, pageType: PageDTOPageTypeEnum.survey, pageNumber: 1 })
    .addPage({ id: 3, pageType: PageDTOPageTypeEnum.survey, pageNumber: 2 })
    .build();
};
