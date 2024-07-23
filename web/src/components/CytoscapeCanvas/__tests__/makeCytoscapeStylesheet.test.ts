import cytoscape from "cytoscape";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";

describe("makeCytoscapeStylesheet", () => {
  test("Generates bound functions to make the SVG data", () => {
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      { clientWidth: 500, clientHeight: 300 } as HTMLElement,
      diagrams,
    );

    const stylesheet = makeCytoscapeStylesheet(cytoscapeCoordinateMapper);
    const symbolEntry = stylesheet.find((s) => s.selector === "node[symbolId]") as cytoscape.Stylesheet;

    const ele = { data: (_name: string) => "181" } as cytoscape.NodeSingular;
    const styleEntry = symbolEntry["style" as keyof typeof symbolEntry] as unknown as Record<
      string,
      (ele: cytoscape.NodeSingular) => void
    >;
    const makeSvg = styleEntry["background-image"];
    const makeWidth = styleEntry["width"];
    const makeHeight = styleEntry["height"];

    const svg = makeSvg?.(ele);
    // Asset imports seem not to work in node/jest as configured
    expect(svg).toBe("data:image/svg+xml;utf8,OtherNew181.svg");

    // Height and width get scaled into viewport pixels
    expect(makeWidth?.(ele)).toBeCloseTo(2.57, 2);
    expect(makeHeight?.(ele)).toBeCloseTo(2.57, 2);
  });
});
