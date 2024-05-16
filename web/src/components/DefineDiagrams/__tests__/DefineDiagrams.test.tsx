import { screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { BASEMAP_LAYER_NAME, MARKS_LAYER_NAME } from "@/components/DefineDiagrams/MapLayers.ts";
import { customRender } from "@/test-utils/jest-utils";
import { RootState } from "@/redux/store.ts";

describe("DefineDiagrams", () => {
  beforeEach(() => {
    // We need this *after* createObjectURL* gets stubbed
    getMockMap().resetState();
  });

  it("should render", async () => {
    customRender(<DefineDiagrams mock={true} />);

    // openlayers map and it's layers should render after features fetched
    const mockMap = getMockMap();
    await waitFor(() => {
      expect(mockMap).toHaveLayer(BASEMAP_LAYER_NAME, LayerType.TILE);
    });

    // header toggle label is visible
    expect(screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("should show marks on the map", async () => {
    customRender(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

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
    customRender(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/404",
      "/plan-generation/define-diagrams/:transactionId",
    );

    await waitForElementToBeRemoved(() => screen.queryByTestId("loading-spinner"));
    expect(screen.getByText("Sorry, there was an error")).toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });

  it("displays loading spinner", async () => {
    const mockState = {
      surveyFeatures: {
        isFetching: true,
        marks: [],
        error: undefined,
      },
    } as Partial<RootState>;
    customRender(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
      { preloadedState: mockState },
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Sorry, there was an error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });
});
