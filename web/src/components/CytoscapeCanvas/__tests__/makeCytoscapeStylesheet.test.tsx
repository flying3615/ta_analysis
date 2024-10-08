import { render } from "@testing-library/react";
import cytoscape from "cytoscape";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { nodeSingular } from "@/test-utils/cytoscape-utils";

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

    const ele = nodeSingular({ symbolId: "181" });
    const styleEntry = getStyleEntryFromStylesheet(symbolEntry);
    const makeSvg = styleEntry["background-image"];
    const makeWidth = styleEntry["width"];
    const makeHeight = styleEntry["height"];

    const svg = makeSvg?.(ele);
    // Asset imports seem not to work in node/jest as configured
    expect(svg).toBe("data:image/svg+xml;utf8,OtherNew181.svg");

    // Height and width get scaled into viewport pixels
    expect(makeWidth?.(ele)).toBeCloseTo(2.21, 2);
    expect(makeHeight?.(ele)).toBeCloseTo(2.21, 2);
  });

  test("Generates functions to style circle around label", () => {
    render(<canvas data-id="layer2-node" />);

    const nodeWithLabelCircledEntry = stylesheet.find(
      (s) => s.selector === "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled]",
    ) as cytoscape.Stylesheet;

    const ele = nodeSingular({
      fontSize: 14,
      font: "Tahoma",
      label: "QQ",
      textAlignment: "centerCenter",
    });
    const styleEntry = getStyleEntryFromStylesheet(nodeWithLabelCircledEntry);

    const svg = styleEntry["background-image"]?.(ele);
    expect(svg).toBe("data:image/svg+xml;utf8,circle.svg");
    const height = styleEntry["height"]?.(ele);
    expect(height).toBeCloseTo(1.9, 1);
    const width = styleEntry["width"]?.(ele);
    expect(width).toBeCloseTo(1.9, 1);
  });

  test("Generates function to show north arrow on the appropriate special node", () => {
    render(<canvas data-id="layer2-node" />);

    const northArrowNode = stylesheet.find((s) => s.selector === "node[id='border_1013']") as cytoscape.Stylesheet;

    const styleEntry = getStyleEntryFromStylesheet(northArrowNode);

    const svg = styleEntry["background-image"];
    expect(svg).toBe("url(compass.svg)");
    expect(styleEntry["width"]).toBeCloseTo(13.8, 1);
    expect(styleEntry["height"]).toBeCloseTo(13.8, 1);
  });

  test("has style for selected nodes", () => {
    const selectedNodeStyle = stylesheet.find(
      (s) => s.selector === "node:selected.node-selected, node.related-label-selected",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["outline-color"]).toBe("rgba(248, 27, 239, 1)");
  });

  test("has style for selected edges", () => {
    const selectedNodeStyle = stylesheet.find(
      (s) => s.selector === "edge:selected, edge.related-label-selected",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["line-color"]).toBe("rgba(248, 27, 239, 1)");
  });

  test("has style for selected labels", () => {
    const selectedNodeStyle = stylesheet.find(
      (s) => s.selector === "node:selected.selectable-label",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["text-background-color"]).toBe("rgba(248, 27, 239, 1)");
  });
});
