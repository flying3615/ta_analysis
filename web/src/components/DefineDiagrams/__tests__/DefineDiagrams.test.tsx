import { render, waitFor } from "@testing-library/react";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { getMockMap, LayerType } from "@linzjs/landonline-openlayers-map";
import { BASEMAP_LAYER_NAME } from "@/components/DefineDiagrams/MapLayers.ts";

describe("Verify rendering of the Define Diagrams Page", () => {
  it("should render", async () => {
    // We need this *after* createObjectURL* gets stubbed

    getMockMap().resetState();

    render(<DefineDiagrams mock={true} />);
    const mockMap = getMockMap();

    await waitFor(() => {
      expect(mockMap).toHaveLayer(BASEMAP_LAYER_NAME, LayerType.TILE);
    });
  });
});
