import { screen, waitFor } from "@testing-library/react";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import {
  BASEMAP_LAYER_NAME,
  MARKS_LAYER_NAME,
  PARCELS_LAYER_NAME,
  VECTORS_LAYER_NAME,
  UNDERLYING_PARCELS_LAYER_NAME,
} from "@/components/DefineDiagrams/MapLayers.ts";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils";
import { RootState } from "@/redux/store.ts";
import LandingPage from "@/components/LandingPage/LandingPage.tsx";
import userEvent from "@testing-library/user-event";
import { server } from "@/mocks/mockServer.ts";

describe("DefineDiagrams", () => {
  const mockMap = getMockMap();
  beforeEach(() => {
    // We need this *after* createObjectURL* gets stubbed
    getMockMap().resetState();
  });

  it("should render", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

    // openlayers map and it's layers should render after features fetched

    await waitFor(() => {
      expect(mockMap).toHaveLayer(BASEMAP_LAYER_NAME, LayerType.TILE);
    });

    // header toggle label is visible
    expect(screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("call prepares dataset on initial render", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).toBeFalsy();
    });

    const expected = {
      method: "POST",
      url: new URL("http://localhost:11065/plan-generation/v1/api/generate-plans/diagrams/123"),
    };
    // async callback from the prepareDataset success
    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining(expected));
  });

  it("should show marks on the map", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

    await waitFor(() => {
      expect(mockMap).toHaveLayer(MARKS_LAYER_NAME, LayerType.VECTOR);
    });

    // validate marks visible
    const marksLayerState = mockMap.layerState[MARKS_LAYER_NAME];
    await waitFor(() => expect(marksLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(marksLayerState).toHaveFeatureCount(13));
    expect(marksLayerState).toHaveFeature(1);
  });

  it("should show parcels on the map", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

    // openlayers map and it's layers should render
    await waitFor(() => {
      expect(mockMap).toHaveLayer(PARCELS_LAYER_NAME, LayerType.VECTOR);
    });

    // validate parcels visible
    const parcelsLayerState = mockMap.layerState[PARCELS_LAYER_NAME];
    await waitFor(() => expect(parcelsLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(parcelsLayerState).toHaveFeatureCount(5));
    expect(parcelsLayerState).toHaveFeature(1);
  });

  it("should show underlying parcels on the map", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );

    // openlayers map and it's layers should render
    await waitFor(() => {
      expect(mockMap).toHaveLayer(UNDERLYING_PARCELS_LAYER_NAME, LayerType.VECTOR_TILE);
    });

    // validate underlying parcels visible
    const underlyingParcelsLayerState = mockMap.layerState[UNDERLYING_PARCELS_LAYER_NAME];
    await waitFor(() => expect(underlyingParcelsLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(underlyingParcelsLayerState).toHaveFeatureCount(2));
    expect(underlyingParcelsLayerState).toHaveFeature(1);
  });

  it("displays error when survey not found", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/404",
      "/plan-generation/define-diagrams/:transactionId",
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });

  it("navigate back to landing page when clicked on dismiss button on Unexpected error dialog", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/define-diagrams/404", [
      { component: <DefineDiagrams mock={true} />, route: "/plan-generation/define-diagrams/:transactionId" },
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
    ]);

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("navigate back to landing page when clicked on dismiss button on preparedataset error dialog", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/define-diagrams/404", [
      { component: <DefineDiagrams mock={true} />, route: "/plan-generation/define-diagrams/:transactionId" },
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
    ]);

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("displays loading spinner when survey data hasn't been loaded", async () => {
    const mockState = {
      surveyFeatures: {
        isFetching: true,
        isFulfilled: false,
        marks: [],
        primaryParcels: [],
        nonPrimaryParcels: [],
        centreLineParcels: [],
        nonBoundaryVectors: [],
        parcelDimensionVectors: [],
        error: undefined,
      },
    } as Partial<RootState>;
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
      { preloadedState: mockState },
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Sorry, there was an error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });

  it("should show vectors on the map", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );
    // openlayers map and it's layers should render
    await waitFor(() => {
      expect(mockMap).toHaveLayer(VECTORS_LAYER_NAME, LayerType.VECTOR);
    });

    // validate vectors visible
    const vectorLayerState = mockMap.layerState[VECTORS_LAYER_NAME];
    await waitFor(() => expect(vectorLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(vectorLayerState).toHaveFeatureCount(8));
    expect(vectorLayerState).toHaveFeature(1);
  });
});
