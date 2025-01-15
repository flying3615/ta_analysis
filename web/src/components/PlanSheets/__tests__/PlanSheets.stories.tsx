// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { PageDTOPageTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, screen, userEvent, waitFor, waitForElementToBeRemoved, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cloneDeep } from "lodash-es";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import LandingPage from "@/components/LandingPage/LandingPage";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { clearAllRecoveryFiles, getRecoveryFile, setRecoveryFile } from "@/hooks/usePlanAutoRecover";
import { AsyncTaskBuilder } from "@/mocks/builders/AsyncTaskBuilder";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { Paths } from "@/Paths";
import { replaceDiagrams, updatePages, UserEdit } from "@/redux/planSheets/planSheetsSlice";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import {
  checkCytoElementProperties,
  clickAtCoordinates,
  clickMultipleCoordinates,
  countSelected,
  getCytoscapeNodeLayer,
  getCytoscapeOffsetInCanvas,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
  StorybookRouter,
  tabletLandscapeParameters,
  TestCanvas,
  waitForLoadingSpinnerToDisappear,
} from "@/test-utils/storybook-utils";
import { downloadBlob } from "@/util/downloadHelper";

export default {
  title: "PlanSheets",
  component: PlanSheets,
  parameters: {
    chromatic: { delay: 300 },
  },
} as Meta<typeof PlanSheets>;

export type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

export const PlanSheetsTemplate = () => {
  return (
    <LuiModalAsyncContextProvider>
      <MockUserContextProvider
        user={singleFirmUserExtsurv1}
        initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}
      >
        <FeatureFlagProvider>
          <QueryClientProvider client={queryClient}>
            <Provider store={cloneDeep(store)}>
              <ModalStoryWrapper>
                <CytoscapeContextProvider>
                  <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
                    <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
                    <Route path={Paths.defineDiagrams} element={<span>Define Diagrams Dummy Page</span>} />
                    <Route path={Paths.root} element={<LandingPage />} />
                  </StorybookRouter>
                </CytoscapeContextProvider>
              </ModalStoryWrapper>
            </Provider>
          </QueryClientProvider>
        </FeatureFlagProvider>
      </MockUserContextProvider>
    </LuiModalAsyncContextProvider>
  );
};

export const Default: Story = {
  beforeEach: clearAllRecoveryFiles,
  render: () => <PlanSheetsTemplate />,
};

export const SmallViewport: Story = {
  ...Default,
  ...tabletLandscapeParameters,
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
  await expect(canvas.queryByRole("heading", { name: "Survey sheet diagrams" })).toBeNull();
};

export const TitlePage1: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(undefined, {
            status: 200,
            statusText: "OK",
          }),
        ),
        http.get(/\/123\/plan$/, () => {
          const pd = planData();
          console.debug(`Fetched planData ${JSON.stringify(pd)}`);
          return HttpResponse.json(pd, { status: 200, statusText: "OK" });
        }),
        http.get(/\/api\/survey\/123\/survey-info/, () => {
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
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(undefined, {
            status: 200,
            statusText: "OK",
          }),
        ),
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(planData(), {
            status: 200,
            statusText: "OK",
          }),
        ),
        http.get(/\/api\/survey\/123\/survey-info/, () => {
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
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(undefined, {
            status: 200,
            statusText: "OK",
          }),
        ),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(planData(), { status: 200, statusText: "OK" });
        }),
        http.get(/\/api\/survey\/123\/survey-info/, () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};

export const UnsavedChangesModalAndCancelLeaveNavigationToDefineDiagrams: Story = {
  ...Default,
};
UnsavedChangesModalAndCancelLeaveNavigationToDefineDiagrams.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitForLoadingSpinnerToDisappear();

  // Dispatch replace diagrams event to set hasChanges = true
  store.dispatch(replaceDiagrams([]));
  await sleep(500);

  await userEvent.click(await canvas.findByText("Sheets"));
  await userEvent.click(await canvas.findByText("Define Diagrams"));
  await userEvent.click(await screen.findByText("Cancel"));

  await userEvent.click(await canvas.findByText("Sheets"));
  await userEvent.click(await canvas.findByText("Define Diagrams"));
  await userEvent.click(await screen.findByText("Leave"));
  await expect(await screen.findByText("Define Diagrams Dummy Page")).toBeInTheDocument();
};

export const UnsavedChangesModalSaveAndLeaveNavigationToDefineDiagrams: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitForLoadingSpinnerToDisappear();

    // Dispatch replace diagrams event to set hasChanges = true
    store.dispatch(replaceDiagrams([]));
    await sleep(500);

    await userEvent.click(await canvas.findByText("Save layout"));

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 20000 });
    await sleep(500);

    // Dispatch replace diagrams event to set hasChanges = true
    store.dispatch(replaceDiagrams([]));
    await sleep(500);

    await userEvent.click(await canvas.findByText("Sheets"));
    await userEvent.click(await canvas.findByText("Define Diagrams"));
    await userEvent.click(await screen.findByText("Save & leave"));

    await waitFor(() => within(document.body).findByText(/Layout saving/), { timeout: 20000 });
    await expect(await screen.findByText("Define Diagrams Dummy Page")).toBeInTheDocument();
  },
};

export const UnsavedChangesModalNavigateToSurveyCapture: Story = {
  ...Default,
};
UnsavedChangesModalNavigateToSurveyCapture.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitForLoadingSpinnerToDisappear();

  // Dispatch replace diagrams event to set hasChanges = true
  store.dispatch(replaceDiagrams([]));
  await sleep(500);

  await userEvent.click(await canvas.findByText("Sheets"));
  await userEvent.click(await canvas.findByText("Survey Capture"));
  await expect(await screen.findByText(/You have unsaved changes/)).toBeInTheDocument();
};

export const LayoutPlansheetsHeaderButtonStateIsResetOnLeavingPage: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectLineButton = await screen.findByLabelText("Select Lines");
    await userEvent.click(selectLineButton);
    await userEvent.click(await canvas.findByText("Sheets"));
    await userEvent.click(await canvas.findByText("Landing Page"));
    await userEvent.click(await canvas.findByText("Layout Plan Sheets"));
    await sleep(500); // This sleep is needed to ensure the page has settled before the comparison snapshot is taken
  },
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

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const DeletePage: Story & Required<Pick<Story, "play">> = {
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
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(
            {
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
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(
            {
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

export const PlanRegenerationFailedModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(new AsyncTaskBuilder().build(), {
            status: 202,
            statusText: "ACCEPTED",
          }),
        ),
        http.get(/\/123\/async-task/, () =>
          HttpResponse.json(new AsyncTaskBuilder().withFailedStatus().build(), {
            status: 200,
            statusText: "OK",
          }),
        ),
      ],
    },
  },
};

export const PlanRegenerationInterruptedModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () =>
          HttpResponse.json(new AsyncTaskBuilder().build(), {
            status: 202,
            statusText: "ACCEPTED",
          }),
        ),
        http.get(/\/123\/async-task/, () =>
          HttpResponse.json(new AsyncTaskBuilder().withInterruptedStatus().build(), {
            status: 200,
            statusText: "OK",
          }),
        ),
      ],
    },
  },
};

export const ZoomIn: Story = {
  ...Default,
  play: async () => {
    await sleep(1000);
    const ZoomInBtn = screen.getByRole("button", { name: PlanMode.ZoomIn });
    await userEvent.click(ZoomInBtn);
  },
};

export const ZoomOut: Story = {
  ...Default,
  play: async () => {
    await sleep(1000);
    const ZoomOutBtn = screen.getByRole("button", { name: PlanMode.ZoomOut });
    await userEvent.click(ZoomOutBtn);
  },
};

export const ZoomCentre: Story = {
  ...Default,
  play: async () => {
    await sleep(1000);
    await userEvent.click(screen.getByRole("button", { name: PlanMode.ZoomOut }));
    await sleep(1000);
    await userEvent.click(screen.getByRole("button", { name: PlanMode.ZoomCentre }));
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
      {
        x: 0,
        y: 0,
      },
      10001,
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
      {
        x: 78,
        y: 0,
      },
      20002,
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
      "labels",
      300,
      "User defined A",
      {
        x: 40,
        y: -5,
      },
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
      "labels",
      400,
      "User defined B",
      {
        x: 40,
        y: -5,
      },
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

export const ExportPdfAndDownload: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByText("Preview layout"));

    const modal = await screen.findByRole("dialog");
    const modalText = /Processing.*Preparing preview of Layout Plan/i;
    await expect(modal.textContent).toMatch(modalText);
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 20000 });

    // code if you want to download the images
    /* eslint-disable-next-line */
    // const imageFiles = (window as any).imageFiles ;
    // imageFiles.forEach((imageFile: ImageFile) => {
    //   const file = new File([imageFile.blob], "image.jpeg", { type: "image/jpeg" });
    //   downloadBlob(file, `layout-plan-${imageFile.name}.jpeg`);
    // });

    const pdf = (window as unknown as { pdfBlob: URL }).pdfBlob;
    const blob = await fetch(pdf).then((r) => r.blob());
    const file = new File([blob], "layout-plan-123.pdf", { type: "application/pdf" });
    downloadBlob(file, `layout-plan-123.pdf`);
  },
};

const CANVAS_CORNER_REL_X = 280;
const CANVAS_CORNER_REL_Y = 56;

const COORDINATE_10001_X = 411;
const COORDINATE_10001_Y = 136;

const COORDINATE_10004_X = 733;
const COORDINATE_10004_Y = 456;

// Enforces 'play' is provided as it is used in PlanSheetsEscapeKeyDeselects stories
export const SelectDiagram: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Diagrams"));
    await sleep(500);

    const cytoscapeElement = await canvas.findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    const x = COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y = COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY;
    clickAtCoordinates(cytoscapeNodeLayer, [x, y]);
    await sleep(500);
  },
};

export const SelectedDiagramContextMenu: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Diagrams"));
    await sleep(500);

    const cytoscapeElement = await canvas.findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    const x = COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y = COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY;
    clickAtCoordinates(cytoscapeNodeLayer, [x, y]);
    clickAtCoordinates(cytoscapeNodeLayer, [x, y], RIGHT_MOUSE_BUTTON);
    await sleep(500);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MoveDiagram: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Diagrams"));
    await sleep(500);

    const cytoscapeElement = await canvas.findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoCanvas = getCytoscapeNodeLayer(cytoscapeElement);

    const position = {
      clientX: COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX,
      clientY: COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY,
    };
    await selectAndDrag(cytoCanvas, position, { clientX: position.clientX + 200, clientY: position.clientY + 150 });
  },
};

export const MoveDiagramToPage: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Diagrams"));
    await sleep(500);

    const cytoscapeElement = await canvas.findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    const x = 411 - CANVAS_CORNER_REL_X + cyOffsetX;
    const y = 136 - CANVAS_CORNER_REL_Y + cyOffsetY;
    clickAtCoordinates(cytoscapeNodeLayer, [x, y], RIGHT_MOUSE_BUTTON);
    await sleep(500);

    const menuLink = await canvas.findByText("Move to page");
    await userEvent.click(menuLink);
    await sleep(500);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsEscapeKeyDeselects stories
export const SelectCoordinates: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);

    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    const x_10001 = COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y_10001 = COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY;

    const x_10004 = COORDINATE_10004_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y_10004 = COORDINATE_10004_Y - CANVAS_CORNER_REL_Y + cyOffsetY;

    clickMultipleCoordinates(cytoscapeNodeLayer, [
      { x: x_10001, y: y_10001 },
      { x: x_10004, y: y_10004 },
    ]);

    await sleep(500);

    clickAtCoordinates(cytoscapeNodeLayer, [x_10001, y_10001]);

    await sleep(500);
  },
};

export const ShowCoordinatesMenu: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    // Location of a mark in cytoscape pixels
    const x = COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y = COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY;
    clickAtCoordinates(cytoscapeNodeLayer, [x, y], RIGHT_MOUSE_BUTTON);
    await sleep(500);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const HideCoordinate: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    // Location of a mark in cytoscape pixels
    const x = COORDINATE_10001_X - CANVAS_CORNER_REL_X + cyOffsetX;
    const y = COORDINATE_10001_Y - CANVAS_CORNER_REL_Y + cyOffsetY;
    clickAtCoordinates(cytoscapeNodeLayer, [x, y], RIGHT_MOUSE_BUTTON);

    const menuHide = await canvas.findByText("Hide");
    await userEvent.click(menuHide);
    await sleep(500);
    clickAtCoordinates(cytoscapeNodeLayer, [10 + cyOffsetX, 10 + cyOffsetY]); // click off node to remove select
    await sleep(500);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsEscapeKeyDeselects stories
export const SelectLine: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [520, 135]);
    await sleep(500);
  },
};

export const ShowDiagramLineMenu: Story = {
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
    await expect(canvas.queryByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const HideDiagramLine: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.contextMenu({ at: [240, 79], select: "Hide" });
    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(1);
  },
};

export const ShowHideCircleLetter: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    const position: [number, number] = [320, 159];
    await test.contextMenu({ at: position, select: "Hide" });
    await test.contextMenu({ at: position, select: "Show" });
    await sleep(500);
    await expect(await countSelected()).toBe(1);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsEscapeKeyDeselects stories
export const SelectLineAndLinkedLabel: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [411, 366]);
    await sleep(500);

    await checkCytoElementProperties("#1006_0", {
      color: "rgb(248,27,239)",
      styleProperty: "line-color",
      className: "element-move-control",
    });
    await checkCytoElementProperties("#13", {
      color: "rgb(248,27,239)",
      styleProperty: "text-background-color",
      className: "related-element-selected",
    });
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsEscapeKeyDeselects stories
export const SelectMarkAndLinkedLabel: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, [411, 135]);
    await sleep(500);

    await checkCytoElementProperties("#10001", {
      color: "rgb(248,27,239)",
      styleProperty: "outline-color",
      className: "related-label-selected",
    });
    await checkCytoElementProperties("#11", {
      color: "rgb(248,27,239)",
      styleProperty: "text-background-color",
      className: "related-element-selected",
    });
  },
};

export const RotateDiagramLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [213, 213], select: "Rotate label" }, "hover");

    const rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 50 } });
    fireEvent.focusOut(rangeInput);
  },
};

export const RotateDiagramLabelProperties: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    async function isnotIs(isnot: string | number, is: string | number) {
      fireEvent.change(angleField, { target: { value: isnot } });
      await expect(await screen.findByText("Must be a number in D.MMSS format")).toBeVisible();
      await waitFor(() => expect(screen.getByRole("button", { name: "OK" })).toBeDisabled());

      fireEvent.change(angleField, { target: { value: is } });
      await waitFor(() => expect(screen.queryByText("Must be a number in D.MMSS format")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("button", { name: "OK" })).toBeEnabled());
    }

    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [213, 213], select: "Rotate label" });

    const rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 50 } });
    fireEvent.focusOut(rangeInput);
    await expect(await countSelected()).toBe(1);

    await test.contextMenu({ at: [213, 213], select: "Properties" });
    const angleField = test.findProperty("TextInput", "Text angle (degrees)");
    await isnotIs(123.6, 123.4);
    await isnotIs(123.596, 123.59);
    await isnotIs("123.00000", "123.0000");
    await isnotIs(123.59596, 123.5959);
    screen.getByRole("button", { name: "OK" }).click();
    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(1);
    // Chromatic to check angle of text
  },
};

export const AutoRecoverPopUpModal: Story = {
  ...Default,
  beforeEach: async () => {
    await clearAllRecoveryFiles();
    // setting mocks with recent lastModifiedAt date to trigger auto recover
    const mockData: UserEdit = {
      ...mockPlanData,
      lastChangedAt: new Date(new Date().getTime()).toISOString(),
    };
    await setRecoveryFile(123, mockData);
    return clearAllRecoveryFiles;
  },
  play: async () => {
    await expect(await screen.findByText("Unsaved changes detected")).toBeTruthy();
    await expect(await screen.findByRole("button", { name: "Yes" })).toBeTruthy();
  },
};

export const AutoRecoverPopUpModalLastUserEditedSave: Story = {
  ...Default,
  beforeEach: async () => {
    await clearAllRecoveryFiles();
    // setting mocks with recent lastModifiedAt date to trigger auto recover
    const mockData: UserEdit = {
      ...mockPlanData,
      lastChangedAt: new Date(new Date().getTime()).toISOString(),
    };
    await setRecoveryFile(123, mockData);
    return clearAllRecoveryFiles;
  },
  play: async () => {
    await userEvent.click(await screen.findByRole("button", { name: "No" }, { timeout: 2000 }));
    await sleep(500); // wait for data to be cleared
    await expect(await getRecoveryFile(123)).toBeUndefined();
  },
};

export const AutoRecoverPopUpModalAutoRecoveryVersion: Story = {
  ...Default,
  beforeEach: async () => {
    await clearAllRecoveryFiles();
    // setting mocks with recent lastModifiedAt date to trigger auto recover
    const mockData: UserEdit = {
      ...mockPlanData,
      lastChangedAt: new Date(new Date().getTime()).toISOString(),
    };
    await setRecoveryFile(123, mockData);
    return clearAllRecoveryFiles;
  },
  play: async () => {
    const dataBeforeRecovery = await getRecoveryFile(123);
    await userEvent.click(await screen.findByRole("button", { name: "Yes" }, { timeout: 2000 }));
    // wait for some time to make sure data is not cleared
    await sleep(500);
    const dataAfterRecovery = await getRecoveryFile(123);
    await expect(dataAfterRecovery).toStrictEqual(dataBeforeRecovery);
  },
};

export const AutoRecoverLastModifiedMismatchClearsData: Story = {
  ...Default,
  beforeEach: async () => {
    await clearAllRecoveryFiles();
    // setting mocks with recent lastModifiedAt date to trigger auto recover
    const mockData: UserEdit = {
      ...mockPlanData,
      lastChangedAt: new Date(new Date().getTime()).toISOString(),
      lastModifiedAt: new Date(new Date(mockPlanData.lastModifiedAt).getTime() - 1000).toISOString(),
    };
    await setRecoveryFile(123, mockData);
    return clearAllRecoveryFiles;
  },
  play: async () => {
    // wait for some time to make sure data is not cleared
    await sleep(500);
    const dataAfterRecoveryCheck = await getRecoveryFile(123);
    await expect(dataAfterRecoveryCheck).toBeUndefined();
  },
};

export const AutoRecoverClearDataAfterSave: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForLoadingSpinnerToDisappear();

    // Dispatch replace diagrams event to set hasChanges = true
    store.dispatch(replaceDiagrams([]));
    await sleep(500); // wait for event to be processed

    // check that data exists before save
    const dataBeforeSave = await getRecoveryFile(123);
    await expect(dataBeforeSave).toBeDefined();

    await userEvent.click(await canvas.findByText("Save layout"));
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 20000 });

    // check that data is cleared after save
    const dataAfterSave = await getRecoveryFile(123);
    await expect(dataAfterSave).toBeUndefined();
  },
};

export const AutoRecoverClearDataAfterLeave: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitForLoadingSpinnerToDisappear();

    // Dispatch replace diagrams event to set hasChanges = true
    store.dispatch(replaceDiagrams([]));
    await sleep(500);

    // check that data exists before leave
    const dataBeforeSave = await getRecoveryFile(123);
    await expect(dataBeforeSave).toBeDefined();

    await userEvent.click(await canvas.findByText("Sheets"));
    await userEvent.click(await canvas.findByText("Define Diagrams"));
    await userEvent.click(await screen.findByText("Leave"));

    // check that data is cleared after leave
    const dataAfterSave = await getRecoveryFile(123);
    await expect(dataAfterSave).toBeUndefined();
  },
};
