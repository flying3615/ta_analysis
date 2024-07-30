// Need the below for OL element styles
import "ol/ol.css";

import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Coordinate } from "ol/coordinate";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { generatePath } from "react-router-dom";

import { drawOnMap } from "@/components/DefineDiagrams/__tests__/util/StoryUtil.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { DefineDiagramsState } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";
import { setupStore } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { sleep } from "@/test-utils/storybook-utils.ts";

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
    <QueryClientProvider client={queryClient}>
      <Provider store={setupStore({ defineDiagrams: initialState })}>
        <FeatureFlagProvider>
          <MemoryRouter initialEntries={[generatePath(Paths.defineDiagrams, { transactionId })]}>
            <Routes>
              <Route path={Paths.defineDiagrams} element={<DefineDiagrams />} />
            </Routes>
          </MemoryRouter>
        </FeatureFlagProvider>
      </Provider>
    </QueryClientProvider>
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
  const primaryDiagramButton = await screen.findByLabelText("Define primary diagram");
  await userEvent.click(primaryDiagramButton);
  await sleep(500); // This sleep is needed, otherwise draw doesn't start
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
  await sleep(500); // This sleep is needed, otherwise draw doesn't start
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
  await sleep(500); // This sleep is needed, otherwise draw doesn't start
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
  await sleep(500); // This sleep is needed, otherwise draw doesn't start
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
};
