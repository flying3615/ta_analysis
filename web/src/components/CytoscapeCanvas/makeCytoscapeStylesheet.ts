import cytoscape, { Stylesheet } from "cytoscape";

import compassSvg from "@/assets/compass.svg";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { getEdgeDashPattern } from "@/components/CytoscapeCanvas/styleEdgeMethods.ts";
import {
  circleLabel,
  fontStyle,
  fontWeight,
  LABEL_PADDING_PX,
  rotatedMargin,
  scaledFontSize,
  textHAlign,
  textJustification,
  textRotationClockwiseFromH,
  textVAlign,
} from "@/components/CytoscapeCanvas/styleNodeMethods.ts";
import { symbolSvgs } from "@/components/CytoscapeCanvas/symbolSvgs.ts";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG.ts";
import { FOREGROUND_COLOUR, FOREGROUND_COLOUR_BLACK } from "@/modules/plan/styling.ts";
import { pixelsPerPoint, pointsPerCm } from "@/util/cytoscapeUtil.ts";

const makeCytoscapeStylesheet = (cytoscapeCoordinateMapper: CytoscapeCoordinateMapper, isGreyScale = false) => {
  const svgDataForSymbol = (ele: cytoscape.NodeSingular) => {
    // The symbolId is either a 2/3 digit ascii code or a character
    const symbolId = ele.data("symbolId");
    const symbolSvg = isNaN(parseInt(symbolId))
      ? symbolSvgs[symbolId.charCodeAt(0).toString() as keyof typeof symbolSvgs]
      : symbolSvgs[symbolId as keyof typeof symbolSvgs];
    if (!symbolSvg) {
      console.warn(`Symbol ${symbolId} not recognised`);
      return {
        svg: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>',
        width: 0,
        height: 0,
      };
    }

    const widthPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg!.widthPlanPixels * pixelsPerPoint) / pointsPerCm,
    );
    const heightPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg!.heightPlanPixels * pixelsPerPoint) / pointsPerCm,
    );

    return makeScaledSVG(symbolSvg.svg, widthPixels, heightPixels);
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
    "font-size": (ele: cytoscape.NodeSingular) => scaledFontSize(ele, cytoscapeCoordinateMapper),
    "font-style": fontStyle,
    "font-weight": fontWeight,
    "text-halign": textHAlign,
    "text-valign": textVAlign,
    "text-justification": textJustification,
    color: isGreyScale ? FOREGROUND_COLOUR_BLACK : "data(fontColor)",
    "z-index": "data(zIndex)",
    "text-background-color": "#FFFFFF",
    "text-background-opacity": "data(textBackgroundOpacity)",
    "text-border-opacity": "data(textBorderOpacity)",
    "text-border-width": "data(textBorderWidth)",
    "text-background-padding": LABEL_PADDING_PX,
    "text-rotation": textRotationClockwiseFromH,
    "background-clip": "none",
    "bounds-expansion": 12, // ensure circles are visible
    "text-margin-x": (ele: cytoscape.NodeSingular) => rotatedMargin(ele, cytoscapeCoordinateMapper).x,
    "text-margin-y": (ele: cytoscape.NodeSingular) => rotatedMargin(ele, cytoscapeCoordinateMapper).y,
    "z-index-compare": "manual",
  };

  const lineBaseStyle = {
    "line-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
    "z-index": 150,
    "z-index-compare": "manual",
    width: "data(pointWidth)",
    "line-dash-pattern": (ele: cytoscape.EdgeSingular) => getEdgeDashPattern(ele, cytoscapeCoordinateMapper),
  };

  const noNodeMarker = {
    "background-opacity": 0,
  };

  return [
    {
      selector: "node, node:active, edge, edge:active",
      style: {
        "overlay-padding": 0,
        "overlay-opacity": 0,
      },
    },
    {
      // Node with label, circled
      selector: "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled]",
      style: {
        ...labelBaseStyle,
        "background-image": (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).svg,
        height: (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).width,
        width: (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).height,
        ...(isGreyScale ? { "background-clip": "none" } : { "bounds-expansion": 12 }),
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
        "background-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
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
        label: "data(label)",
        color: "#ffffff",
        "font-size": "10px",
        "background-opacity": 0,
        "text-valign": "center",
        "text-halign": "center",
      },
    },
    // Node styles for survey info
    {
      selector: "node[id^='survey_info_']",
      style: {
        label: "data(label)", // Display node labels
        "text-valign": "center",
        "text-halign": (ele: cytoscape.NodeSingular) => ele.data("text-halign") || "center",
        "text-max-width": (ele: cytoscape.NodeSingular) => ele.data("text-max-width"),
        "font-size": (ele: cytoscape.NodeSingular) => ele.data("font-size"),
        "text-wrap": (ele: cytoscape.NodeSingular) => ele.data("text-wrap") || "ellipsis",
        "line-height": (ele: cytoscape.NodeSingular) => ele.data("line-height") || 1.2,
        ...noNodeMarker,
        height: 1,
        width: 1,
      },
    },
    {
      // Node styles for the page number in preview
      selector: "node[id='border_page_no_preview']",
      style: {
        shape: "rectangle",
        label: "data(label)",
        "font-size": "15px",
        "text-valign": "center",
        "text-halign": "center",
      },
    },
    {
      selector: "edge",
      style: {
        ...lineBaseStyle,
        "line-cap": "round",
      },
    },
    {
      selector: "edge[dashStyle]",
      style: {
        ...lineBaseStyle,
        "line-style": "data(dashStyle)",
      },
    },
    {
      selector: "edge[dashPattern]",
      style: {
        ...lineBaseStyle,
        "line-cap": "butt",
      },
    },
    {
      selector: "edge[targetArrowShape]",
      style: {
        ...lineBaseStyle,
        "curve-style": "straight", // needed to render arrows
        "target-arrow-shape": "data(targetArrowShape)",
        "target-arrow-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
      },
    },
    {
      selector: "edge[sourceArrowShape]",
      style: {
        ...lineBaseStyle,
        "source-arrow-shape": "data(sourceArrowShape)",
        "source-arrow-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
      },
    },
    {
      selector: ":parent",
      style: {
        "border-width": 0,
        padding: 0,
        label: "",
      },
    },
    {
      selector: ".elem-selected:selected",
      style: {
        "background-opacity": 0.1,
        "background-color": "#0099FF",
        "border-width": 1,
        "border-color": "#0099FF",
      },
    },
    {
      selector: "#root",
      style: {
        "background-color": "white",
        "border-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
      },
    },
  ] as Stylesheet[];
};

export default makeCytoscapeStylesheet;
