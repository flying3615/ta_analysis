// Need the below for OL element styles
import "ol/ol.css";

import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { generatePath } from "react-router-dom";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { Provider } from "react-redux";
import { setupStore } from "@/redux/store";
import { Paths } from "@/Paths";
import { rest } from "msw";
import { MarksBuilder } from "@/mocks/data/MarksBuilder";
import { handlers } from "@/mocks/mockHandlers";

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
  <Provider store={setupStore()}>
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={[generatePath(Paths.defineDiagrams, { transactionId })]}>
        <Routes>
          <Route path={Paths.defineDiagrams} element={<DefineDiagrams />} />
        </Routes>
      </MemoryRouter>
    </FeatureFlagProvider>
  </Provider>
);

type Story = StoryObj<typeof DefineDiagramsWrapper>;

export const Default: Story = {
  render: DefineDiagramsWrapper,
  parameters: {
    backgrounds: {
      default: "ocean",
      values: [{ name: "ocean", value: "#90e9ff" }],
    },
    msw: {
      handlers: [
        ...handlers,
        // Return two marks in order to center the map on the geotiles fixture data we have manually defined
        rest.get(/\/survey-features\/456$/, (_, res, ctx) =>
          res(
            ctx.status(200, "OK"),
            ctx.json({
              marks: [
                MarksBuilder.unmarkedPoint().withCoordinates([14.8280094, -41.306448]).build(),
                MarksBuilder.unmarkedPoint().withCoordinates([14.8337251, -41.308552]).build(),
              ],
              primaryParcels: [],
              nonPrimaryParcels: [],
              centreLineParcels: [],
            }),
          ),
        ),
        // mock basemaps endpoint
        rest.get(/^https:\/\/basemaps.linz.govt.nz\/v1\/tiles\//, async (_, res, ctx) => {
          return res(
            ctx.set("Content-Length", "0"),
            ctx.set("Content-Type", "application/x-protobuf"),
            ctx.body(new ArrayBuffer(0)),
          );
        }),
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
    transactionId: "456",
  },
};
