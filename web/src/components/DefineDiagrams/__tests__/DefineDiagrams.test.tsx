import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { generatePath, Route } from "react-router-dom";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams";
import { Layer } from "@/components/DefineDiagrams/MapLayers";
import LandingPage from "@/components/LandingPage/LandingPage";
import { server } from "@/mocks/mockServer";
import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

describe("DefineDiagrams", () => {
  const mockMap = getMockMap();
  beforeEach(() => {
    // We need this *after* createObjectURL* gets stubbed
    getMockMap().resetState();
  });

  it("should render", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );
    await waitFor(() => {
      const button = screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" });
      expect(button).toBeTruthy();
    });
  });

  it("call prepares dataset and subsequent queries on initial render", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).toBeFalsy();
    });

    // async callback from the prepareDataset success
    // Note: Prepare dataset should only be called once!
    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalled();
    });

    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: "http://localhost/api/v1/generate-plans/123/prepare",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/survey-features",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/diagrams",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/lines",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/diagram-labels",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/diagrams-check",
        }),
      }),
    );
  });

  it("should show marks on the map", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.MARKS, LayerType.VECTOR);
    });

    const marksLayerState = mockMap.layerState[Layer.MARKS];
    await waitFor(() => {
      expect(marksLayerState?.visible).toBeTruthy();
    });

    await waitFor(() => {
      expect(marksLayerState).toHaveFeatureCount(13);
    });

    expect(marksLayerState).toHaveFeature(1);
  });

  it("should show parcels on the map", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    // openlayers map and its layers should render
    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.PARCELS, LayerType.VECTOR);
    });

    const parcelsLayerState = mockMap.layerState[Layer.PARCELS];
    await waitFor(() => {
      expect(parcelsLayerState?.visible).toBeTruthy();
    });

    await waitFor(() => {
      expect(parcelsLayerState).toHaveFeatureCount(5);
    });

    expect(parcelsLayerState).toHaveFeature(1);
  });

  it("should show underlying parcels on the map", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    // openlayers map and its layers should render
    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.UNDERLYING_PARCELS, LayerType.VECTOR_TILE);
    });

    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.UNDERLYING_ROAD_CENTER_LINE, LayerType.VECTOR_TILE);
    });

    // validate underlying parcels visible
    const underlyingParcelsLayerState = mockMap.layerState[Layer.UNDERLYING_PARCELS];
    await waitFor(() => {
      expect(underlyingParcelsLayerState?.visible).toBeTruthy();
    });

    await waitFor(() => {
      expect(underlyingParcelsLayerState).toHaveFeatureCount(2);
    });

    expect(underlyingParcelsLayerState).toHaveFeature(1);
  });

  it("should show diagrams on the map", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "124" }),
    );

    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.DIAGRAMS, LayerType.VECTOR);
    });

    const diagramsLayerState = mockMap.layerState[Layer.DIAGRAMS];
    await waitFor(() => {
      expect(diagramsLayerState?.visible).toBeTruthy();
    });

    await waitFor(() => {
      expect(diagramsLayerState).toHaveFeatureCount(6);
    });

    for (let i = 1; i <= 6; i++) {
      expect(diagramsLayerState).toHaveFeature(i);
    }
  });

  it("displays error when survey not found", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "404" }),
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });

  it("navigate back to landing page when clicked on dismiss button on error dialog", async () => {
    renderCompWithReduxAndRoute(
      <>
        <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />
        <Route element={<LandingPage />} path={Paths.root} />
      </>,
      generatePath(Paths.defineDiagrams, { transactionId: "404" }),
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("displays loading spinner when survey data hasn't been loaded", async () => {
    server.use(http.get(/\/123\/diagrams$/, () => HttpResponse.text(null, { status: 404 })));
    server.use(http.get(/\/survey-features\/123$/, () => HttpResponse.text(null, { status: 404 })));

    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Sorry, there was an error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  });

  it("should show vectors on the map", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DefineDiagrams mock={true} />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
    );

    await waitFor(() => {
      expect(mockMap).toHaveLayer(Layer.VECTORS, LayerType.VECTOR);
    });

    const vectorLayerState = mockMap.layerState[Layer.VECTORS];
    await waitFor(() => {
      expect(vectorLayerState?.visible).toBeTruthy();
    });

    await waitFor(() => {
      expect(vectorLayerState).toHaveFeatureCount(8);
    });

    expect(vectorLayerState).toHaveFeature(1);
  });
});
