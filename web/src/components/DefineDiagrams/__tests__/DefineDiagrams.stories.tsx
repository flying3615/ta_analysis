// Need the below for OL element styles
import "ol/ol.css";

import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { generatePath } from "react-router-dom";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { Provider } from "react-redux";
import { setupStore } from "@/redux/store";
import { Paths } from "@/Paths";
import { HttpResponse, http } from "msw";
import { handlers } from "@/mocks/mockHandlers";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/queries";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { unmarkedPointBuilder } from "@/mocks/data/mockMarks.ts";

export default {
  title: "DefineDiagrams",
  component: DefineDiagrams,
  argTypes: {
    transactionId: {
      control: "text",
    },
  },
} as Meta<typeof DefineDiagrams>;

const DefineDiagramsWrapper = ({ transactionId }: { transactionId: string }) => (
  <LuiModalAsyncContextProvider>
    <QueryClientProvider client={queryClient}>
      <Provider store={setupStore()}>
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
        http.get(/\/survey-features\/456$/, async () =>
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

export const SystemGeneratedDiagrams: Story = {
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
