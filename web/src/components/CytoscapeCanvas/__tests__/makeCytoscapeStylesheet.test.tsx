import { render } from "@testing-library/react";
import cytoscape from "cytoscape";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";

describe("makeCytoscapeStylesheet", () => {
  const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
    { clientWidth: 500, clientHeight: 300 } as HTMLElement,
    diagrams,
  );

  const stylesheet = makeCytoscapeStylesheet(cytoscapeCoordinateMapper);

  const getStyleEntryFromStylesheet = (symbolEntry: cytoscape.StylesheetStyle | cytoscape.StylesheetCSS) =>
    symbolEntry["style" as keyof typeof symbolEntry] as unknown as Record<
      string,
      (ele: cytoscape.NodeSingular) => void
    >;

  test("Generates bound functions to make the SVG data", () => {
    const symbolEntry = stylesheet.find((s) => s.selector === "node[symbolId]") as cytoscape.Stylesheet;

    const ele = { data: (_name: string) => "181" } as cytoscape.NodeSingular;
    const styleEntry = getStyleEntryFromStylesheet(symbolEntry);
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

  test("Generates functions to style circle around label", () => {
    render(<canvas data-id="layer2-node" />);

    const nodeWithLabelCircledEntry = stylesheet.find(
      (s) => s.selector === "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled]",
    ) as cytoscape.Stylesheet;

    const nodeData = {
      fontSize: 14,
      font: "Tahoma",
      label: "QQ",
    };
    const ele = { data: (name: string) => nodeData[name as keyof typeof nodeData] } as cytoscape.NodeSingular;
    const styleEntry = getStyleEntryFromStylesheet(nodeWithLabelCircledEntry);

    const svg = styleEntry["background-image"]?.(ele);
    expect(svg).toBe("data:image/svg+xml;utf8,circle.svg");
    const height = styleEntry["height"]?.(ele);
    expect(height).toBeCloseTo(10.82, 1);
    const width = styleEntry["width"]?.(ele);
    expect(width).toBeCloseTo(10.82, 1);
    const textMarginY = styleEntry["text-margin-y"]?.(ele);
    expect(textMarginY).toBe(0); // Because `measureText` stub
  });
});
