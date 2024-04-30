import { render, screen, waitFor } from "@testing-library/react";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { BASEMAP_LAYER_NAME } from "@/components/DefineDiagrams/MapLayers.ts";
import { MemoryRouter, generatePath } from "react-router-dom";
import { Paths } from "@/Paths";

describe("Verify rendering of the Define Diagrams Page", () => {
  it("should render", async () => {
    // We need this *after* createObjectURL* gets stubbed

    getMockMap().resetState();

    render(
      <MemoryRouter initialEntries={[`${generatePath(Paths.defineDiagrams, { transactionId: 123 })}`]}>
        <DefineDiagrams mock={true} />
      </MemoryRouter>,
    );
    const mockMap = getMockMap();

    await waitFor(() => {
      expect(mockMap).toHaveLayer(BASEMAP_LAYER_NAME, LayerType.TILE);
    });

    // header toggle label
    expect(screen.getByText("Diagrams")).toBeInTheDocument();
  });
});
