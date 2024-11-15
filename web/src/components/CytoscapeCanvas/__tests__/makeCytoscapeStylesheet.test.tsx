import { render } from "@testing-library/react";
import cytoscape from "cytoscape";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet";
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

    const ele63 = nodeSingular({ symbolId: "63" });
    const ele96 = nodeSingular({ symbolId: "96" });
    const ele97 = nodeSingular({ symbolId: "97" });
    const ele111 = nodeSingular({ symbolId: "111" });
    const ele112 = nodeSingular({ symbolId: "112" });
    const ele117 = nodeSingular({ symbolId: "117" });
    const ele179 = nodeSingular({ symbolId: "179" });
    const ele181 = nodeSingular({ symbolId: "181" });
    const ele182 = nodeSingular({ symbolId: "182" });

    const styleEntry = getStyleEntryFromStylesheet(symbolEntry);
    const makeSvg = styleEntry["background-image"];
    const makeWidth = styleEntry["width"];
    const makeHeight = styleEntry["height"];

    const svg63 = makeSvg?.(ele63);
    const svg96 = makeSvg?.(ele96);
    const svg97 = makeSvg?.(ele97);
    const svg111 = makeSvg?.(ele111);
    const svg112 = makeSvg?.(ele112);
    const svg117 = makeSvg?.(ele117);
    const svg179 = makeSvg?.(ele179);
    const svg181 = makeSvg?.(ele181);
    const svg182 = makeSvg?.(ele182);

    // Asset imports seem not to work in node/jest as configured
    expect(svg63).toBe("data:image/svg+xml;utf8,CSNMAdopt63.svg");
    expect(svg96).toBe("data:image/svg+xml;utf8,PrmNew96.svg");
    expect(svg97).toBe("data:image/svg+xml;utf8,PrmOld97.svg");
    expect(svg111).toBe("data:image/svg+xml;utf8,BoundPostAdopt111.svg");
    expect(svg112).toBe("data:image/svg+xml;utf8,BoundPostOld112.svg");
    expect(svg117).toBe("data:image/svg+xml;utf8,CSNMOld117.svg");
    expect(svg179).toBe("data:image/svg+xml;utf8,UnmkNew179.svg");
    expect(svg181).toBe("data:image/svg+xml;utf8,OtherNew181.svg");
    expect(svg182).toBe("data:image/svg+xml;utf8,OtherOld182.svg");

    // Height and width get scaled into viewport pixels
    expect(makeWidth?.(ele63)).toBeCloseTo(3.866, 2);
    expect(makeHeight?.(ele63)).toBeCloseTo(3.866, 2);

    expect(makeWidth?.(ele96)).toBeCloseTo(3.866, 2);
    expect(makeHeight?.(ele96)).toBeCloseTo(3.866, 2);

    expect(makeWidth?.(ele97)).toBeCloseTo(3.866, 2);
    expect(makeHeight?.(ele97)).toBeCloseTo(3.866, 2);

    expect(makeWidth?.(ele111)).toBeCloseTo(2.209, 2);
    expect(makeHeight?.(ele111)).toBeCloseTo(2.209, 2);

    expect(makeWidth?.(ele112)).toBeCloseTo(2.209, 2);
    expect(makeHeight?.(ele112)).toBeCloseTo(2.209, 2);

    expect(makeWidth?.(ele117)).toBeCloseTo(3.866, 2);
    expect(makeHeight?.(ele117)).toBeCloseTo(3.866, 2);

    expect(makeWidth?.(ele179)).toBeCloseTo(2.209, 2);
    expect(makeHeight?.(ele179)).toBeCloseTo(2.209, 2);

    expect(makeWidth?.(ele181)).toBeCloseTo(1.66, 2);
    expect(makeHeight?.(ele181)).toBeCloseTo(1.66, 2);

    expect(makeWidth?.(ele182)).toBeCloseTo(1.66, 2);
    expect(makeHeight?.(ele182)).toBeCloseTo(1.66, 2);
  });

  test("Generates functions to style circle around label", () => {
    render(<canvas data-id="layer2-node" />);

    const nodeWithLabelCircledEntry = stylesheet.find(
      (s) => s.selector === "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled][^symbolId]",
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
    expect(height).toBeCloseTo(0.18, 1);
    const width = styleEntry["width"]?.(ele);
    expect(width).toBeCloseTo(0.18, 1);
    const fontFamily = styleEntry["font-family"]?.(ele);
    expect(fontFamily).toBe("Roboto, sans-serif");
  });

  const fontCases: string[][] = [
    ["Arial", "Arimo, sans-serif"],
    ["Times New Roman", "Tinos, serif"],
    ["Tahoma", "Roboto, sans-serif"],
  ];

  test.each(fontCases)("converts font %s to %s", (startFont, expectedFont) => {
    const nodeWithLabel = stylesheet.find(
      (s) => s.selector === "node[label][font][fontSize][fontColor][textBackgroundOpacity][^circled][^symbolId]",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(nodeWithLabel);

    const ele = nodeSingular({
      fontSize: 14,
      font: startFont,
      label: "Label",
    });
    const fontFamily = styleEntry["font-family"]?.(ele);
    expect(fontFamily).toBe(expectedFont);
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
      (s) => s.selector === "node:selected, node.related-label-selected",
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
      (s) => s.selector === "node:selected.selectable-label, node[label].related-element-selected",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["text-background-color"]).toBe("rgba(248, 27, 239, 1)");
  });

  test("has style for unselected diagram node", () => {
    const selectedNodeStyle = stylesheet.find(
      (s) => s.selector === "node[elementType='diagram']",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["shape"]).toBe("rectangle");
    expect(styleEntry["height"]).toBe("data(height)");
    expect(styleEntry["width"]).toBe("data(width)");
  });

  test("has style for selected diagram node", () => {
    const selectedNodeStyle = stylesheet.find(
      (s) => s.selector === "node[elementType='diagram']:selected",
    ) as cytoscape.Stylesheet;
    const styleEntry = getStyleEntryFromStylesheet(selectedNodeStyle);
    expect(styleEntry["outline-opacity"]).toBe(0);
  });
});
