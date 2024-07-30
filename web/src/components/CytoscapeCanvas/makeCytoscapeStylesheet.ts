import cytoscape, { Stylesheet } from "cytoscape";

import compassSvg from "@/assets/compass.svg";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  circleLabel,
  fontStyle,
  fontWeight,
  LABEL_PADDING_PX,
  rotatedMargin,
  textDiameter,
  textHAlign,
  textJustification,
  textMarginY,
  textRotationClockwiseFromH,
  textVAlign,
} from "@/components/CytoscapeCanvas/styleNodeMethods.ts";
import { symbolSvgs } from "@/components/CytoscapeCanvas/symbolSvgs.ts";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG.ts";
import { pixelsPerPoint, pointsPerCm } from "@/util/pixelConversions.ts";

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

    return makeScaledSVG(symbolSvg!, widthPixels, heightPixels);
  };

  // Dimensions for the compass in plan units
  const compassPlanWidthCm = 50;
  const compassPlanHeightCm = 50;

  // Convert to Cytoscape units
  const widthPixels = cytoscapeCoordinateMapper.planCmToCytoscape((compassPlanWidthCm * pixelsPerPoint) / pointsPerCm);
  const heightPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
    (compassPlanHeightCm * pixelsPerPoint) / pointsPerCm,
  );

  const svgDataForCompass = {
    svg: `url(${compassSvg})`,
    width: widthPixels,
    height: heightPixels,
  };

  const labelBaseStyle = {
    label: "data(label)",
    "line-height": 1,
    "text-wrap": "wrap",
    "text-max-width": "8000px",
    "font-family": "data(font)",
    "font-size": "data(fontSize)",
    "font-style": fontStyle,
    "font-weight": fontWeight,
    "text-halign": textHAlign,
    "text-valign": textVAlign,
    "text-justification": textJustification,
    color: "data(fontColor)",
    "text-background-color": "#FFFFFF",
    "text-background-opacity": "data(textBackgroundOpacity)",
    "text-border-opacity": "data(textBorderOpacity)",
    "text-border-width": "data(textBorderWidth)",
    "text-background-padding": LABEL_PADDING_PX,
    "text-rotation": textRotationClockwiseFromH,
    "background-clip": "none",
    "bounds-expansion": 12, // ensure circles are visible
    "text-margin-x": (ele: cytoscape.NodeSingular) => rotatedMargin(ele).x,
    "text-margin-y": (ele: cytoscape.NodeSingular) => rotatedMargin(ele).y,
  };

  const noNodeMarker = {
    "background-opacity": 0,
  };

  return [
    {
      // Node with label, circled
      selector: "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled]",
      style: {
        ...labelBaseStyle,
        "background-image": circleLabel,
        height: textDiameter,
        width: textDiameter,
        "text-margin-y": textMarginY,
        "bounds-expansion": 80,
      },
    },
    {
      // Node with label
      selector: "node[label][font][fontSize][fontColor][textBackgroundOpacity][^circled]",

      style: {
        ...labelBaseStyle,
        ...noNodeMarker,
      },
    },
    {
      // Node shown as a symbol
      selector: "node[symbolId]",
      style: {
        label: "",
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
        ...noNodeMarker,
        height: 1,
        width: 1,
      },
    },
    {
      // Node with no label
      selector: "node[^label]",
      style: {
        ...noNodeMarker,
        height: 1,
        width: 1,
      },
    },
    {
      // Node style for the page border
      selector: "node[id^='border_']",
      style: {
        "background-color": "black",
      },
    },
    {
      // Node shown as compass
      selector: "node[id='border_1013']",
      style: {
        "background-image": svgDataForCompass.svg,
        "background-color": "white",
        "background-fit": "contain",
        width: svgDataForCompass.width,
        height: svgDataForCompass.height,
      },
    },
    {
      // Node styles for the page number overlay
      selector: "node[id='border_page_no']",
      style: {
        shape: "rectangle",
        width: "label",
        height: "label",
        label: "data(label)",
        "background-opacity": 0,
        "text-valign": "center",
        "text-halign": "center",
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
