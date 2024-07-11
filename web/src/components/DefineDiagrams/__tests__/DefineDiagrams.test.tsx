import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import {
  DIAGRAMS_LAYER_NAME,
  MARKS_LAYER_NAME,
  PARCELS_LAYER_NAME,
  UNDERLYING_PARCELS_LAYER_NAME,
  UNDERLYING_ROAD_CENTER_LINE_LAYER_NAME,
  VECTORS_LAYER_NAME,
} from "@/components/DefineDiagrams/MapLayers.ts";
import LandingPage from "@/components/LandingPage/LandingPage.tsx";
import { server } from "@/mocks/mockServer.ts";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils";

const buttonLabels = [
  "Delete",
  "Zoom in",
  "Zoom out",
  "Zoom centre",
  "Select RT lines",
  "Add RT lines",
  "Draw RT boundary",
  "Draw abuttal",
  "Select line",
  "Define primary diagram",
  "Define non-primary diagram",
  "Define survey diagram rectangle",
  "Select diagram",
  "Label diagrams",
  "Enlarge diagram",
  "Reduce diagram",
  "Manage labels",
];

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
    // header toggle label is visible
    expect(screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("should have all navigation buttons", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
    );
    window.alert = jest.fn();

    buttonLabels.forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });

    buttonLabels.forEach((label) => {
      fireEvent.click(screen.getByLabelText(label));
      expect(window.alert).toHaveBeenCalledWith("Not Yet Implemented");
    });
  });

  it("call prepares dataset and subsequent queries on initial render", async () => {
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

    // async callback from the prepareDataset success
    // Note: Prepare dataset should only be called once!
    expect(requestSpy).toHaveBeenCalledTimes(4);
    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: "http://localhost/api/v1/generate-plans/diagrams/123",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/survey-features/123",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/diagrams/123",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/123/lines",
        }),
      }),
    );
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
    await waitFor(() => {
      expect(mockMap).toHaveLayer(UNDERLYING_ROAD_CENTER_LINE_LAYER_NAME, LayerType.VECTOR_TILE);
    });

    // validate underlying parcels visible
    const underlyingParcelsLayerState = mockMap.layerState[UNDERLYING_PARCELS_LAYER_NAME];
    await waitFor(() => expect(underlyingParcelsLayerState?.visible).toBeTruthy());
    await waitFor(() => expect(underlyingParcelsLayerState).toHaveFeatureCount(2));
    expect(underlyingParcelsLayerState).toHaveFeature(1);
  });

  it("should show diagrams on the map", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/124",
      "/plan-generation/define-diagrams/:transactionId",
    );

    // openlayers map and it's layers should render
    const mockMap = getMockMap();
    await waitFor(() => {
      expect(mockMap).toHaveLayer(DIAGRAMS_LAYER_NAME, LayerType.VECTOR);
    });

    // validate diagrams visible
    const diagramsLayerState = mockMap.layerState[DIAGRAMS_LAYER_NAME];
    await waitFor(() => expect(diagramsLayerState?.visible).toBeTruthy());
    await waitFor(() => {
      expect(diagramsLayerState).toHaveFeatureCount(6);
    });
    expect(diagramsLayerState).toHaveFeature(1);
    expect(diagramsLayerState).toHaveFeature(2);
    expect(diagramsLayerState).toHaveFeature(3);
    expect(diagramsLayerState).toHaveFeature(4);
    expect(diagramsLayerState).toHaveFeature(5);
    expect(diagramsLayerState).toHaveFeature(6);
  });

  it("displays error when survey not found", async () => {
    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/404",
      "/plan-generation/define-diagrams/:transactionId",
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.queryByTestId("openlayers-map")).not.toBeInTheDocument();
  }, 120000);

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
    server.use(http.get(/\/diagrams\/123$/, () => HttpResponse.text(null, { status: 404 })));
    server.use(http.get(/\/survey-features\/123$/, () => HttpResponse.text(null, { status: 404 })));

    renderCompWithReduxAndRoute(
      <DefineDiagrams mock={true} />,
      "/plan-generation/define-diagrams/123",
      "/plan-generation/define-diagrams/:transactionId",
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
