import { screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { BASEMAP_LAYER_NAME, MARKS_LAYER_NAME } from "@/components/DefineDiagrams/MapLayers.ts";
import { MemoryRouter, Route, Routes, generatePath } from "react-router-dom";
import { Paths } from "@/Paths";
import { renderWithProviders } from "@/test-utils/jest-utils";

describe("DefineDiagrams", () => {
  const renderDefineDiagrams = (transactionId: number = 123) => {
    const path = generatePath(Paths.defineDiagrams, { transactionId });

    renderWithProviders(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={Paths.defineDiagrams} element={<DefineDiagrams mock={true} />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    // We need this *after* createObjectURL* gets stubbed
    getMockMap().resetState();
  });

  it("should render", async () => {
    renderDefineDiagrams();

    // loading spinner while fetching features
    await screen.findByTestId("loading-spinner");

    // openlayers map and it's layers should render after features fetched
    const mockMap = getMockMap();
    await waitFor(() => {
      expect(mockMap).toHaveLayer(BASEMAP_LAYER_NAME, LayerType.TILE);
    });

    // header toggle label is visible
    expect(screen.getByText("Diagrams")).toBeInTheDocument();
  });

  it("should show marks on the map", async () => {
    renderDefineDiagrams();

    // openlayers map and it's layers should render
    const mockMap = getMockMap();
    await waitFor(() => {
      expect(mockMap).toHaveLayer(MARKS_LAYER_NAME, LayerType.VECTOR);
    });

    // validate marks visible
    const marksLayerState = mockMap.layerState[MARKS_LAYER_NAME];
    await waitFor(() => expect(marksLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(marksLayerState).toHaveFeatureCount(13));
    expect(marksLayerState).toHaveFeature(1);
  });

  it("displays error when survey not found", async () => {
    renderDefineDiagrams(404);

    await waitForElementToBeRemoved(() => screen.queryByTestId("loading-spinner"));
    expect(screen.getByText("Sorry, there was an error")).toBeInTheDocument();
  });
});
