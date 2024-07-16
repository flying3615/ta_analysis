import { Stylesheet } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { symbolSvgs } from "@/components/CytoscapeCanvas/symbolSvgs.ts";

const pixelsPerPoint = 0.75;
const pointsPerCm = 28.3465;

const makeCytoscapeStylesheet = (cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const svgDataForSymbol = (ele: cytoscape.NodeSingular) => {
    // The symbolId is either a 2/3 digit ascii code or a character
    const symbolId = ele.data("symbolId");
    const symbolSvg = isNaN(parseInt(symbolId))
      ? symbolSvgs[symbolId.charCodeAt(0).toString() as keyof typeof symbolSvgs]
      : symbolSvgs[symbolId as keyof typeof symbolSvgs];
    if (!symbolSvg) {
      console.warn(`Symbol ${symbolId} not recognised`);
    }

    const widthPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg!.widthPlanPixels * pixelsPerPoint) / pointsPerCm,
    );
    const heightPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg!.heightPlanPixels * pixelsPerPoint) / pointsPerCm,
    );

    // symbolSvg contains the nominal image sizes and the SVG text
    // which is called by substituting the %WIDTH% and %HEIGHT% below
    return {
      svg:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          symbolSvg!.svg.replace("%WIDTH%", widthPixels.toString()).replace("%HEIGHT%", heightPixels.toString()),
        ),
      width: widthPixels,
      height: heightPixels,
    };
  };

  return [
    {
      // Node with label
      selector: "node[label][font-family][font-size]",
      style: {
        "background-color": "#FFFFFF",
        label: "data(label)",
        "font-family": "data(font)",
        "font-size": "data(fontSize)",
        height: 5,
        width: 5,
      },
    },
    {
      // Node shown as a symbol
      selector: "node[symbolId]",
      style: {
        "background-image": (ele) => svgDataForSymbol(ele).svg,
        width: (ele: cytoscape.NodeSingular) => svgDataForSymbol(ele).width,
        height: (ele) => svgDataForSymbol(ele).height,
        "background-clip": "none",
        "bounds-expansion": 12,
      },
    },
    {
      selector: "node[label]",
      style: {
        height: 1,
        width: 1,
      },
    },
    {
      // Node with no label
      selector: "node[^label]",
      style: {
        visibility: "hidden",
        height: 1,
        width: 1,
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": "#000000",
        "line-cap": "round",
        width: "data(pointWidth)",
      },
    },
    {
      selector: "edge[dashStyle]",
      style: {
        "line-style": "data(dashStyle)",
      },
    },
    {
      selector: "edge[dashPattern]",
      style: {
        "line-dash-pattern": "data(dashPattern)",
        "line-cap": "butt",
      },
    },
    {
      selector: "edge[targetArrowShape]",
      style: {
        "curve-style": "straight", // needed to render arrows
        "target-arrow-shape": "data(targetArrowShape)",
        "target-arrow-color": "#000",
      },
    },
    {
      selector: "edge[sourceArrowShape]",
      style: {
        "source-arrow-shape": "data(sourceArrowShape)",
        "source-arrow-color": "#000",
      },
    },
    {
      selector: "#root",
      style: {
        "background-color": "white",
        "border-color": "black",
      },
    },
  ] as Stylesheet[];
};

export default makeCytoscapeStylesheet;
