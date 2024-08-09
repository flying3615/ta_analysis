// Need the below for OL element styles
import "ol/ol.css";

import { LuiMessagingContextProvider } from "@linzjs/lui";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent, waitFor, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Coordinate } from "ol/coordinate";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { drawOnMap } from "@/components/DefineDiagrams/__tests__/util/StoryUtil.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { DefineDiagramsState } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";
import { setupStore } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
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

const DefineDiagramsWrapper = ({ transactionId }: { transactionId: string }) => (
  <LuiModalAsyncContextProvider>
    <LuiMessagingContextProvider version="v2">
      <QueryClientProvider client={queryClient}>
        <Provider store={setupStore({ defineDiagrams: initialState })}>
          <FeatureFlagProvider>
            <StorybookRouter url={generatePath(Paths.defineDiagrams, { transactionId })}>
              <Route path={Paths.defineDiagrams} element={<DefineDiagrams />} />
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
        http.get(/\/456\/survey-features$/, async () =>
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
        http.get(/^https:\/\/basemaps.linz.govt.nz\/v1\/tiles\//, async () =>
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
  const primaryDiagramButton = await screen.findByLabelText("Define primary diagram");
  await userEvent.click(primaryDiagramButton);
  const primaryDiagramByRectangleButton = await screen.findByRole("menuitem", {
    name: /Rectangle/,
  });
  await userEvent.click(primaryDiagramByRectangleButton);

  const drawRectangle: Coordinate[] = [
    [19461942.908835247, -5057781.164343697],
    [19462120.6946788, -5057678.53342492],
  ];
  //   draw polygon around features to select them
  await drawOnMap(drawRectangle);
  await sleep(500); //This sleep is needed for diagram to show
};

export const DrawNonPrimaryDiagramByPolygonBoundaryError: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: {},
  },
  args: {
    transactionId: "125",
  },
};

DrawNonPrimaryDiagramByPolygonBoundaryError.play = async () => {
  await waitForInitialMapLoadsToComplete();
  const nonPrimaryDiagramButton = await screen.findByLabelText("Define non-primary diagram");
  await userEvent.click(nonPrimaryDiagramButton);
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
  const nonPrimaryDiagramButton = await screen.findByLabelText("Define non-primary diagram");
  await userEvent.click(nonPrimaryDiagramButton);
  const nonPrimaryDiagramByPolygonButton = await screen.findByRole("menuitem", {
    name: /Polygon/,
  });
  await userEvent.click(nonPrimaryDiagramByPolygonButton);

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
  const surveyDiagramButton = await screen.findByLabelText("Define survey diagram");
  await userEvent.click(surveyDiagramButton);
  const surveyDiagramByPolygonButton = await screen.findByRole("menuitem", {
    name: /Polygon/,
  });
  await userEvent.click(surveyDiagramByPolygonButton);

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
        http.post(/\/124\/convert-extinguished-lines/, async () => {
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
