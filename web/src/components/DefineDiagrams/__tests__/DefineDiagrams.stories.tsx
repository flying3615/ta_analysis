// Need the below for OL element styles
import "ol/ol.css";

import { LuiMessagingContextProvider } from "@linzjs/lui";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent, waitFor, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isEqual } from "lodash-es";
import { http, HttpResponse } from "msw";
import { Coordinate } from "ol/coordinate";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { doubleClickOnMap, drawOnMap } from "@/components/DefineDiagrams/__tests__/util/StoryUtil";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams";
import LandingPage from "@/components/LandingPage/LandingPage";
import { unmarkedPointBuilder } from "@/mocks/data/mockMarks";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { DefineDiagramsState } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { setupStore } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { sleep, StorybookRouter, waitForInitialMapLoadsToComplete } from "@/test-utils/storybook-utils";

export default {
  title: "DefineDiagrams",
  component: DefineDiagrams,
  argTypes: {
    transactionId: {
      control: "text",
    },
  },
} as Meta<typeof DefineDiagrams>;

const initialState: DefineDiagramsState = {
  action: "idle",
};

const queryClient = new QueryClient();
const coordinatesOfPointOnDiagramA: Coordinate[] = [[19461488.02830917, -5058113.19031095]];

const DefineDiagramsWrapper = ({ transactionId }: { transactionId: string }) => (
  <LuiModalAsyncContextProvider>
    <LuiMessagingContextProvider version="v2">
      <QueryClientProvider client={queryClient}>
        <Provider store={setupStore({ defineDiagrams: initialState })}>
          <FeatureFlagProvider>
            <StorybookRouter url={generatePath(Paths.defineDiagrams, { transactionId })}>
              <Route path={Paths.defineDiagrams} element={<DefineDiagrams />} />
              <Route path={Paths.root} element={<LandingPage />} />
            </StorybookRouter>
          </FeatureFlagProvider>
        </Provider>
      </QueryClientProvider>
    </LuiMessagingContextProvider>
  </LuiModalAsyncContextProvider>
);

type Story = StoryObj<typeof DefineDiagramsWrapper>;

export const Default: Story = {
  render: DefineDiagramsWrapper,
  parameters: {
    backgrounds: {
      default: "ocean",
      values: [{ name: "ocean", value: "#b8dcf2" }],
    },
    msw: {
      handlers: [
        ...handlers,
        // Return two marks in order to center the map on the geotiles fixture data we have manually defined
        http.get(/\/123\/survey-features$/, () =>
          HttpResponse.json(
            {
              marks: [
                unmarkedPointBuilder().withCoordinates([14.8280094, -41.306448]).build(),
                unmarkedPointBuilder().withCoordinates([14.8337251, -41.308552]).build(),
              ],
              primaryParcels: [],
              nonPrimaryParcels: [],
              centreLineParcels: [],
            },
            { status: 200, statusText: "OK" },
          ),
        ),
        // mock basemaps endpoint
        http.get(/^https:\/\/basemaps.linz.govt.nz\/v1\/tiles\//, () =>
          HttpResponse.arrayBuffer(new ArrayBuffer(0), {
            headers: { "Content-Type": "application/x-protobuf", "Content-Length": "0" },
          }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
Default.play = async () => {
  await waitForInitialMapLoadsToComplete();
};

export const UnderlyingLayers: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "125",
  },
};
UnderlyingLayers.play = async () => {
  await waitForInitialMapLoadsToComplete();
};

export const RoadCentrelineLayers: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "126",
  },
};
RoadCentrelineLayers.play = async () => {
  await waitForInitialMapLoadsToComplete();
};

export const Diagrams: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    msw: {
      handlers: [...handlers],
    },
  },
  args: {
    transactionId: "124",
  },
};
Diagrams.play = async () => {
  await waitForInitialMapLoadsToComplete();
};

export const PrepareDatasetError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    msw: {
      handlers: [
        ...handlers,
        http.get(/\/666\/diagrams$/, () => HttpResponse.json({ diagrams: {} }, { status: 200, statusText: "OK" })),
      ],
    },
  },
  args: {
    transactionId: "666",
  },
};
PrepareDatasetError.play = async () => {
  await waitForInitialMapLoadsToComplete();
  await waitFor(() => within(document.body).findByText(/prepare dataset application error/), { timeout: 20000 });
};

export const DrawPrimaryDiagramByRectangle: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "125",
  },
};

DrawPrimaryDiagramByRectangle.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const primaryDiagramRectangleButton = await screen.findByLabelText("Define primary diagram (Rectangle)");
  await userEvent.click(primaryDiagramRectangleButton);

  const drawRectangle: Coordinate[] = [
    [19461942.908835247, -5057781.164343697],
    [19462120.6946788, -5057678.53342492],
  ];
  //   draw polygon around features to select them
  await drawOnMap(drawRectangle);
  await sleep(500); //This sleep is needed for diagram to show
};

export const DrawButtonsDisabled: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    msw: {
      handlers: [
        http.get(/\/125\/diagrams-check/, () => {
          return HttpResponse.json(
            {
              isPrimaryParcelsExists: false,
              isNonPrimaryParcelsExists: false,
              isTraverseExists: false,
            },
            { status: 200, statusText: "OK" },
          );
        }),
        ...handlers,
      ],
    },
  },
  args: {
    transactionId: "125",
  },
};

DrawButtonsDisabled.play = async () => {
  await waitForInitialMapLoadsToComplete();

  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_primary_diagram_rectangle")).findByLabelText(
        "Primary user defined diagrams cannot be created, as there is no boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_primary_diagram_polygon")).findByLabelText(
        "Primary user defined diagrams cannot be created, as there is no boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_nonprimary_diagram_rectangle")).findByLabelText(
        "Non Primary user defined diagrams cannot be created, as there is no boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_nonprimary_diagram_polygon")).findByLabelText(
        "Non Primary user defined diagrams cannot be created, as there is no boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_survey_diagram_rectangle")).findByLabelText(
        "User defined survey diagrams cannot be created, as there is no non boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
  await waitFor(
    () =>
      within(screen.getByTestId("tid_define_survey_diagram_polygon")).findByLabelText(
        "User defined survey diagrams cannot be created, as there is no non boundary information included in this survey",
      ),
    { timeout: 20000 },
  );
};

export const DrawNonPrimaryDiagramByPolygon: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "123",
  },
};

DrawNonPrimaryDiagramByPolygon.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const nonPrimaryDiagramPolygonButton = await screen.findByLabelText("Define non-primary diagram (Polygon)");
  await userEvent.click(nonPrimaryDiagramPolygonButton);
  const drawPolygon: Coordinate[] = [
    [19461563.508509796, -5057886.183127218],
    [19461498.683984406, -5057952.186280345],
    [19461563.508509796, -5058035.868849486],
    [19461654.262845345, -5058028.79708308],
    [19461653.08421761, -5057952.775594211],
    [19461563.508509796, -5057886.183127218],
  ];
  //   draw polygon around features to select them
  await drawOnMap(drawPolygon);
  await sleep(500); //This sleep is needed for diagram to show
};

export const DrawSurveyDiagramByPolygon: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "123",
  },
};

DrawSurveyDiagramByPolygon.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const surveyDiagramPolygonButton = await screen.findByLabelText("Define survey diagram (Polygon)");
  await userEvent.click(surveyDiagramPolygonButton);

  const drawPolygon: Coordinate[] = [
    [19461563.508509796, -5057886.183127218],
    [19461498.683984406, -5057952.186280345],
    [19461563.508509796, -5058035.868849486],
    [19461654.262845345, -5058028.79708308],
    [19461653.08421761, -5057952.775594211],
    [19461563.508509796, -5057886.183127218],
  ];
  //   draw polygon around features to select them
  await drawOnMap(drawPolygon);
  await sleep(500); //This sleep is needed for diagram to show
};

export const AddRTLines: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

AddRTLines.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const selectRTLinesButton = await screen.findByLabelText("Select RT lines");
  await userEvent.click(selectRTLinesButton);
  await sleep(100); // This sleep is needed for line selection
  const lineCoordinates: Coordinate[] = [[19461498.200913828, -5057986.54062496]];
  await drawOnMap(lineCoordinates);
  const addRTLinesButton = await screen.findByLabelText("Add RT lines");
  await userEvent.click(addRTLinesButton);
  await expect(await screen.findByText("RT Line added successfully")).toBeInTheDocument();
};

export const RTLineAlreadyPresentError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    msw: {
      handlers: [
        http.post(/\/124\/convert-extinguished-lines/, () => {
          return HttpResponse.json(
            {
              ok: false,
              statusCode: -26019,
              message: "Error 126019: This line has already been added to the database as a Record of Title line.",
            },
            { status: 200, statusText: "OK" },
          );
        }),
        ...handlers,
      ],
    },
  },
  args: {
    transactionId: "124",
  },
};

RTLineAlreadyPresentError.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const selectRTLinesButton = await screen.findByLabelText("Select RT lines");
  await userEvent.click(selectRTLinesButton);
  await sleep(100); // This sleep is needed for line selection
  const lineCoordinates: Coordinate[] = [[19461498.200913828, -5057986.54062496]];
  await drawOnMap(lineCoordinates);
  const addRTLinesButton = await screen.findByLabelText("Add RT lines");
  await userEvent.click(addRTLinesButton);
  await expect(
    await screen.findByText(
      "Error 126019: This line has already been added to the database as a Record of Title line.",
    ),
  ).toBeInTheDocument();
};

export const DeleteRTAndAbuttalLines: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
  play: async ({ step }) => {
    await step("GIVEN I'm defining a diagram that contains an RT line and an abuttal line", async () => {
      await waitForInitialMapLoadsToComplete();
    });
    await step("WHEN I select and delete the RT line and an abbutal line", async () => {
      const selectLineButton = await screen.findByLabelText("Select line");
      await userEvent.click(selectLineButton);
      await sleep(100); // This sleep is needed for line selection
      const lineCoordinatesForRTLine: number[] = [19461540.31034258, -5058018.909898458];
      const lineCoordinatesForAbuttalLine: number[] = [19461513.01764351, -5057986.070653658];
      const lineCoordinates: Coordinate[] = [lineCoordinatesForRTLine, lineCoordinatesForAbuttalLine];
      await drawOnMap(lineCoordinates, "Control");
      const deleteSelectedButton = await screen.findByLabelText("Delete selected feature(s)");
      await userEvent.click(deleteSelectedButton);
    });
    await step("THEN the lines are removed", async () => {
      await expect(await screen.findByText("Lines removed successfully")).toBeInTheDocument();
    });
  },
};

export const DefineDiagramsHeaderButtonStateIsResetOnLeavingPage: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForInitialMapLoadsToComplete();
    const selectLineButton = await screen.findByLabelText("Select line");
    await userEvent.click(selectLineButton);
    await userEvent.click(await canvas.findByText("Diagrams"));
    await userEvent.click(await canvas.findByText("Landing Page"));
    await userEvent.click(await canvas.findByText("Define Diagrams"));
    await sleep(500); // This sleep is needed to ensure the page has settled before the comparison snapshot is taken
  },
};

export const DeleteDiagram: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

DeleteDiagram.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram", async () => {
    await waitForInitialMapLoadsToComplete();
    const selectDiagramButton = await screen.findByLabelText("Select Diagrams");
    await userEvent.click(selectDiagramButton);
    await sleep(100); // This sleep is needed for diagram selection
    const diagramCoordinates: Coordinate[] = [[19461406.541349366, -5058120.795760532]];
    await drawOnMap(diagramCoordinates);
  });
  await step("WHEN I click on delete button", async () => {
    const deleteSelectedButton = await screen.findByLabelText("Delete selected feature(s)");
    await userEvent.click(deleteSelectedButton);
  });
  await step("THEN the diagram is deleted", async () => {
    await expect(await screen.findByText("Diagram removed successfully")).toBeInTheDocument();
  });
};

export const EnlargeDiagram: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

EnlargeDiagram.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to enlarge", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a rectangle that overlaps the selected diagram", async () => {
    const rectangleCoordinates: Coordinate[] = [
      [19461370.143840656, -5058116.4497893425],
      [19461406.541349366, -5058147.414834067],
    ];
    await enlargeRectangle(rectangleCoordinates);
  });
  await step("THEN the diagram is enlarged", async () => {
    await sleep(500);
    //(Snapshot checks the appearance of the diagram)
  });
};

export const EnlargeDiagramOverlapError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

EnlargeDiagramOverlapError.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to enlarge", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a rectangle that doesn't overlap the selected diagram", async () => {
    const rectangleCoordinates: Coordinate[] = [
      [19461942.908835247, -5057781.164343697],
      [19462120.6946788, -5057678.53342492],
    ];
    await enlargeRectangle(rectangleCoordinates);
  });
  await step("THEN I'm shown an error message", async () => {
    await waitFor(() => within(document.body).findByText(/The new shape must overlap part of the selected diagram/));
  });
};

export const EnlargeDiagramInvalidShapeError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

EnlargeDiagramInvalidShapeError.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to enlarge", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a polygon that would create an invalid shape (with a hole in the middle)", async () => {
    const polygonCoordinates: Coordinate[] = [
      [19461362.538391076, -5058125.68497812],
      [19461411.973813355, -5058145.785094871],
      [19461369.600594256, -5058155.020283649],
      [19461410.34407416, -5058171.860922008],
      [19461338.092303135, -5058181.639357184],
      [19461362.538391076, -5058125.68497812],
    ];
    await enlargePolygon(polygonCoordinates);
  });
  await step("THEN I'm shown an error message", async () => {
    await waitFor(() => within(document.body).findByText(/The altered diagram is invalid and cannot be saved/));
  });
};

export const ReduceDiagram: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

ReduceDiagram.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to reduce", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a rectangle that overlaps the selected diagram", async () => {
    const rectangleCoordinates: Coordinate[] = [
      [19461370.143840656, -5058116.4497893425],
      [19461406.541349366, -5058147.414834067],
    ];
    await reduceRectangle(rectangleCoordinates);
  });
  await step("THEN the diagram is reduced", async () => {
    await sleep(500);
    //(Snapshot checks the appearance of the diagram)
  });
};

export const ReduceDiagramOverlapError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

ReduceDiagramOverlapError.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to reduce", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a rectangle that doesn't overlap the selected diagram", async () => {
    const rectangleCoordinates: Coordinate[] = [
      [19461942.908835247, -5057781.164343697],
      [19462120.6946788, -5057678.53342492],
    ];
    await reduceRectangle(rectangleCoordinates);
  });
  await step("THEN I'm shown an error message", async () => {
    await waitFor(() => within(document.body).findByText(/The new shape must overlap part of the selected diagram/));
  });
};
export const ReduceDiagramInvalidShapeError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "124",
  },
};

ReduceDiagramInvalidShapeError.play = async ({ step }) => {
  await step("GIVEN I've selected a diagram to reduce", async () => {
    await selectDiagram(coordinatesOfPointOnDiagramA);
  });
  await step("WHEN I draw a polygon that would create an invalid shape (with a hole in the middle)", async () => {
    const polygonCoordinates: Coordinate[] = [
      [19461414.14679895, -5058150.131066061],
      [19461438.04964049, -5058139.809384486],
      [19461423.925234124, -5058189.788053164],
      [19461414.14679895, -5058150.131066061],
    ];
    await reducePolygon(polygonCoordinates);
  });
  await step("THEN I'm shown an error message", async () => {
    await waitFor(() => within(document.body).findByText(/The altered diagram is invalid and cannot be saved/));
  });
};

const selectDiagram = async (coordinatesToClick: Coordinate[]) => {
  await waitForInitialMapLoadsToComplete();
  const selectDiagramButton = await screen.findByLabelText("Select Diagrams");
  await userEvent.click(selectDiagramButton);
  await sleep(500); // This sleep is needed for line selection
  await drawOnMap(coordinatesToClick);
};

const enlargeRectangle = async (coordinatesToClick: Coordinate[]) => {
  const enlargeDiagramRectangleButton = await screen.findByLabelText("Enlarge diagram (Rectangle)");
  await userEvent.click(enlargeDiagramRectangleButton);
  await drawOnMap(coordinatesToClick);
};

const enlargePolygon = async (coordinatesToClick: Coordinate[]) => {
  const enlargeDiagramPolygonButton = await screen.findByLabelText("Enlarge diagram (Polygon)");
  await userEvent.click(enlargeDiagramPolygonButton);
  await drawOnMap(coordinatesToClick);
};

const reduceRectangle = async (coordinatesToClick: Coordinate[]) => {
  const reduceDiagramRectangleButton = await screen.findByLabelText("Reduce diagram (Rectangle)");
  await userEvent.click(reduceDiagramRectangleButton);
  await drawOnMap(coordinatesToClick);
};
const reducePolygon = async (coordinatesToClick: Coordinate[]) => {
  const reduceDiagramPolygonButton = await screen.findByLabelText("Reduce diagram (Polygon)");
  await userEvent.click(reduceDiagramPolygonButton);
  await drawOnMap(coordinatesToClick);
};

export const DrawAbuttalLine: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    msw: {
      handlers: [
        ...handlers,
        http.post(/\/generate-plans\/124\/lines/, async (x) => {
          const data = await x.request.json();
          // This condition is to check payload sent by front end on saving the abuttal line
          // In case of payload mismatch, mock will return 500 and screenshot comparison will fail due to error message pop up
          if (
            !isEqual(data, {
              coordinates: [
                { x: 14.825238431597192, y: -41.30820674368461 },
                { x: 14.826404767234976, y: -41.30819208065594 },
                { x: 14.826443807758425, y: -41.308511000785025 },
                { x: 14.825453154476186, y: -41.30856598685653 },
              ],
            })
          ) {
            return HttpResponse.json(
              { ok: true, statusCode: null, message: null },
              { status: 500, statusText: "NOT OK" },
            );
          }
          return HttpResponse.json({ ok: true, statusCode: null, message: null }, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
  args: {
    transactionId: "124",
  },
};

DrawAbuttalLine.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const drawAbuttalLinesButton = await screen.findByLabelText("Draw abuttal line");
  await userEvent.click(drawAbuttalLinesButton);
  const lineCoordinates: Coordinate[] = [
    [19461456.520018045, -5057908.929665045],
    [19461586.355907332, -5057906.75667945],
    [19461590.70187852, -5057954.019116136],
    [19461480.42285959, -5057962.167812116],
  ];
  await drawOnMap(lineCoordinates);
  if (lineCoordinates[3]) {
    await doubleClickOnMap(lineCoordinates[3]);
  }
};

export const DrawAbuttalLineErrorMessagePopUp: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    msw: {
      handlers: [
        ...handlers,
        http.post(/\/generate-plans\/124\/lines/, () =>
          HttpResponse.html("<html lang='en'><body>Unexpected exception</body></html>", {
            status: 500,
            statusText: "Failed",
          }),
        ),
      ],
    },
  },
  args: {
    transactionId: "124",
  },
};

DrawAbuttalLineErrorMessagePopUp.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const drawAbuttalLinesButton = await screen.findByLabelText("Draw abuttal line");
  await userEvent.click(drawAbuttalLinesButton);
  const lineCoordinates: Coordinate[] = [
    [19461456.520018045, -5057908.929665045],
    [19461586.355907332, -5057906.75667945],
    [19461590.70187852, -5057954.019116136],
    [19461480.42285959, -5057962.167812116],
  ];
  await drawOnMap(lineCoordinates);
  if (lineCoordinates[3]) {
    await doubleClickOnMap(lineCoordinates[3]);
  }
  await expect(await screen.findByText("Create abuttal line failed due to unexpected error")).toBeInTheDocument();
};
