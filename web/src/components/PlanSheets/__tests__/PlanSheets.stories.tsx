// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { PageDTOPageTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, screen, userEvent, waitForElementToBeRemoved, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cloneDeep } from "lodash-es";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { AsyncTaskBuilder } from "@/mocks/builders/AsyncTaskBuilder";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { Paths } from "@/Paths";
import { replaceDiagrams, updatePages } from "@/redux/planSheets/planSheetsSlice";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import {
  clickAtCoordinates,
  clickMultipleCoordinates,
  getCytoscapeNodeLayer,
  getCytoscapeOffsetInCanvas,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
  StorybookRouter,
  tabletLandscapeParameters,
} from "@/test-utils/storybook-utils";
import { downloadBlob } from "@/util/downloadHelper";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

export type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LuiModalAsyncContextProvider>
        <FeatureFlagProvider>
          <Provider store={cloneDeep(store)}>
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
          console.log(`Fetched planData ${JSON.stringify(pd)}`);
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
      "coordinateLabels",
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

const LABEL_14_X = 493;
const LABEL_14_Y = 269;

export const SelectDiagram: Story = {
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
    clickAtCoordinates(cytoscapeNodeLayer, x, y);
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
    clickAtCoordinates(cytoscapeNodeLayer, x, y, RIGHT_MOUSE_BUTTON);
    await sleep(500);

    const menuLink = await canvas.findByText("Move to page");
    await userEvent.click(menuLink);
    await sleep(500);
  },
};

export const SelectCoordinates: Story = {
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

    clickAtCoordinates(cytoscapeNodeLayer, x_10001, y_10001);

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
    clickAtCoordinates(cytoscapeNodeLayer, x, y, RIGHT_MOUSE_BUTTON);
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
    clickAtCoordinates(cytoscapeNodeLayer, x, y, RIGHT_MOUSE_BUTTON);

    const menuHide = await canvas.findByText("Hide");
    await userEvent.click(menuHide);
    await sleep(500);
    clickAtCoordinates(cytoscapeNodeLayer, 10 + cyOffsetX, 10 + cyOffsetY); // click off node to remove select
    await sleep(500);
  },
};

export const SelectLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 520, 135);
    await sleep(500);
  },
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
    clickAtCoordinates(cytoscapeNodeLayer, 520, 135, RIGHT_MOUSE_BUTTON);
    await sleep(500);
    await expect(canvas.queryByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  },
};

export const DeletePageLine: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeDisabled();
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 785, 289, RIGHT_MOUSE_BUTTON);
    await sleep(500);
    await userEvent.click(await canvas.findByText("Delete"));
    await sleep(500);
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeEnabled();
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const HideLine: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 520, 135, RIGHT_MOUSE_BUTTON);
    await sleep(500);

    const menuHide = await canvas.findByText("Hide");
    await userEvent.click(menuHide);
    await sleep(500);
    clickAtCoordinates(cytoscapeNodeLayer, 10 + 520, 10 + 135);
    await sleep(500);
  },
};

const checkElementProperties = async (
  selector: string,
  expectedColor: string,
  styleProperty: string,
  expectedClass: string,
) => {
  const element = window.cyRef.$(selector);
  if (element.length > 0) {
    const color = element.style(styleProperty) as string;
    const classes = element.classes();

    await expect(color).toBe(expectedColor);
    await expect(classes).toContain(expectedClass);
  } else {
    console.log(`Element with ID ${selector} not found.`);
  }
};

export const SelectLineAndLinkedLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 411, 366);
    await sleep(500);

    await checkElementProperties("#1006_0", "rgb(248,27,239)", "line-color", "element-move-control");
    await checkElementProperties("#13", "rgb(248,27,239)", "text-background-color", "related-element-selected");
  },
};

export const SelectMarkAndLinkedLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 411, 135);
    await sleep(500);

    await checkElementProperties("#10001", "rgb(248,27,239)", "outline-color", "related-label-selected");
    await checkElementProperties("#11", "rgb(248,27,239)", "text-background-color", "related-element-selected");
  },
};

export const RotateDiagramLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);

    clickAtCoordinates(cytoscapeNodeLayer, LABEL_14_X, LABEL_14_Y, RIGHT_MOUSE_BUTTON);
    await sleep(500);

    const rotateLabelMenuItem = await canvas.findByText("Rotate label");
    await userEvent.hover(rotateLabelMenuItem);
    await sleep(500);

    const rangeInput = await canvas.findByRole("slider");

    fireEvent.change(rangeInput, { target: { value: 50 } });
    fireEvent.mouseOut(rotateLabelMenuItem);
  },
};
