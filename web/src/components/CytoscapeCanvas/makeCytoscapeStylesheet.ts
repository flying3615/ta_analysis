import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { Stylesheet } from "cytoscape";

import compassSvg from "@/assets/compass.svg";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { getEdgeDashPattern } from "@/components/CytoscapeCanvas/styleEdgeMethods";
import {
  circleLabel,
  fontStyle,
  fontWeight,
  getLabelText,
  LABEL_PADDING_PX,
  scaledFontSize,
  svgDataForSymbolFun,
  textJustification,
  textRotationClockwiseFromH,
} from "@/components/CytoscapeCanvas/styleNodeMethods";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import {
  ELEMENT_HOVERED_COLOR,
  ELEMENT_SELECTED_COLOR,
  FOREGROUND_COLOUR,
  FOREGROUND_COLOUR_BLACK,
  GREYED_FOREGROUND_COLOUR,
} from "@/modules/plan/styling";
import { pixelsPerPoint, pointsPerCm } from "@/util/cytoscapeUtil";

const opacityFromDisplayState = (ele: cytoscape.NodeSingular) =>
  [DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(ele.data("displayState") as string)
    ? 0.2
    : 1;

const makeCytoscapeStylesheet = (cytoscapeCoordinateMapper: CytoscapeCoordinateMapper, isGreyScale = false) => {
  const svgDataForSymbol = svgDataForSymbolFun(cytoscapeCoordinateMapper);

  const cytoscapeMmWidth = Math.ceil(cytoscapeCoordinateMapper.planCmToCytoscape(0.1));

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
    label: (ele: cytoscape.NodeSingular) => getLabelText(ele),
    "line-height": 1,
    "text-wrap": "wrap",
    "text-max-width": "8000px",
    "font-family": "data(font)",
    "font-size": (ele: cytoscape.NodeSingular) => scaledFontSize(ele, cytoscapeCoordinateMapper),
    "font-style": fontStyle,
    "font-weight": fontWeight,
    "text-halign": "center",
    "text-valign": "center",
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
    "text-outline-color": "white",
    "text-outline-width": "0.5px",
    "text-outline-opacity": 0,
    "z-index-compare": "manual",
  };

  const lineBaseStyle = {
    "line-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
    opacity: opacityFromDisplayState,
    "z-index": 150,
    "z-index-compare": "manual",
    width: "data(pointWidth)",
    "line-dash-pattern": (ele: cytoscape.EdgeSingular) => getEdgeDashPattern(ele, cytoscapeCoordinateMapper),
  };

  const noNodeMarker = {
    "background-opacity": 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showNodeDebugStyle = {
    "text-background-opacity": 0,
    "background-color": "red",
    "background-opacity": 1,
  };

  const markStyles = [
    {
      // Node shown as a symbol
      selector: "node[symbolId]",
      style: {
        ...noNodeMarker,
        label: "",
        "background-image": (ele) => svgDataForSymbol(ele).svg,
        width: (ele: cytoscape.NodeSingular) => svgDataForSymbol(ele).width,
        height: (ele) => svgDataForSymbol(ele).height,
        "background-clip": "none",
        "bounds-expansion": 12,
        shape: (ele) => svgDataForSymbol(ele).nodeShape,
        "background-image-opacity": opacityFromDisplayState,
      },
    },

    {
      // Node with no label
      selector: "node[^label]",
      style: {
        ...noNodeMarker,
        height: 5,
        width: 5,
      },
    },
    {
      selector: "node:selected, node.related-label-selected",
      style: {
        "outline-width": 2,
        "outline-offset": 2,
        "outline-color": ELEMENT_SELECTED_COLOR,
        "outline-opacity": 0.5,
        "background-image-containment": "over",
      },
    },
    {
      // A diagram selection node displays a rectangle with the same dimensions as the diagram
      selector: `node[elementType='${PlanElementType.DIAGRAM}']`,
      style: {
        shape: "rectangle",
        height: "data(height)",
        width: "data(width)",
      },
    },
    {
      // SelectedDiagram displays controls instead of default :selected style
      selector: `node[elementType='${PlanElementType.DIAGRAM}']:selected`,
      style: {
        "outline-opacity": 0,
      },
    },
  ] as Stylesheet[];

  const lineStyles = [
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
        "arrow-scale": "data(arrowScale)",
        "curve-style": "straight", // needed to render arrows
        "target-arrow-shape": "data(targetArrowShape)",
        "target-arrow-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
      },
    },
    {
      selector: "edge[sourceArrowShape]",
      style: {
        ...lineBaseStyle,
        "arrow-scale": "data(arrowScale)",
        "curve-style": "straight", // needed to render arrows
        "source-arrow-shape": "data(sourceArrowShape)",
        "source-arrow-color": isGreyScale ? FOREGROUND_COLOUR_BLACK : FOREGROUND_COLOUR,
      },
    },
    {
      selector: "edge[targetArrowShape][^sourceArrowShape]",
      style: {
        ...lineBaseStyle,
        "source-endpoint": "inside-to-node",
      },
    },
    {
      selector: "edge[sourceArrowShape][^targetArrowShape]",
      style: {
        ...lineBaseStyle,
        "target-endpoint": "inside-to-node",
      },
    },
    {
      selector: `edge.hover`,
      style: {
        "line-color": ELEMENT_HOVERED_COLOR,
        width: 1,
      },
    },
    {
      selector: "edge:selected, edge.related-label-selected",
      style: {
        "line-color": ELEMENT_SELECTED_COLOR,
        "source-arrow-color": ELEMENT_SELECTED_COLOR,
        "target-arrow-color": ELEMENT_SELECTED_COLOR,
      },
    },
  ] as Stylesheet[];

  const labelStyles = [
    {
      // Node with label, circled
      selector: "node[label][font][fontSize][fontColor][textBackgroundOpacity][circled][^symbolId]",
      style: (() => {
        return {
          ...labelBaseStyle,
          "background-image": (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).svg,
          width: (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).width,
          height: (ele: cytoscape.NodeSingular) => circleLabel(ele, cytoscapeCoordinateMapper).height,
          label: "",
          ...(isGreyScale ? { "background-clip": "none" } : { "bounds-expansion": 12 }),
        };
      })(),
    },
    {
      // Node with label
      selector: "node[label][font][fontSize][fontColor][textBackgroundOpacity][^circled][^symbolId]",

      style: {
        ...labelBaseStyle,
        ...noNodeMarker,
      },
    },
    {
      selector: "node[label][^symbolId].selectable-label",
      style: {
        "text-events": "yes",
      },
    },
    {
      // Node with label selected
      selector: "node:selected.selectable-label, node[label].related-element-selected",
      style: {
        "text-background-color": ELEMENT_SELECTED_COLOR,
        "text-background-opacity": 0.5,
        "text-background-shape": "roundrectangle",
        "text-outline-opacity": 0.8,
      },
    },
    {
      selector: "node[label][^symbolId].selectable-label.hover",
      style: {
        color: ELEMENT_HOVERED_COLOR,
      },
    },
    {
      selector: "node[label][^symbolId]",
      style: {
        ...noNodeMarker,
        height: 5,
        width: 5,
        // ...showNodeDebugStyle, // Uncomment it to show node debug style
      },
    },
  ] as Stylesheet[];

  const otherStyles = [
    {
      selector: "node, node:active, edge, edge:active",
      style: {
        "overlay-padding": 0,
        "overlay-opacity": 0,
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
        "text-halign": (ele: cytoscape.NodeSingular) => (ele.data("text-halign") as string) || "center",
        "text-max-width": (ele: cytoscape.NodeSingular) => ele.data("text-max-width") as number,
        "font-size": (ele: cytoscape.NodeSingular) => ele.data("font-size") as number,
        "text-wrap": (ele: cytoscape.NodeSingular) => (ele.data("text-wrap") as string) || "ellipsis",
        "line-height": (ele: cytoscape.NodeSingular) => (ele.data("line-height") as number | undefined) ?? 1.2,
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

    // select diagram
    {
      selector: `edge.diagram-control`,
      style: {
        "line-color": ELEMENT_SELECTED_COLOR,
        width: 1,
      },
    },
    {
      selector: `node.diagram-control`,
      style: {
        "background-color": ELEMENT_SELECTED_COLOR,
        "background-opacity": 1,
        height: 8,
        width: 8,
      },
    },
    {
      selector: `.selected-diagram`,
      style: {
        "background-opacity": 0.2,
        "background-color": ELEMENT_SELECTED_COLOR,
        height: "data(height)",
        shape: "rectangle",
        width: "data(width)",
      },
    },

    // move element
    {
      selector: "edge.element-move-vector",
      style: {
        "curve-style": "straight", // needed to render arrows
        "line-cap": "butt",
        "line-color": GREYED_FOREGROUND_COLOUR,
        "line-dash-pattern": [2 * cytoscapeMmWidth, 2 * cytoscapeMmWidth],
        "line-style": "dashed",
        "target-arrow-color": GREYED_FOREGROUND_COLOUR,
        "target-arrow-shape": "chevron",
        width: 0.75,
      },
    },
    {
      selector: ".transparent,[invisible]",
      style: {
        opacity: 0,
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

  return [...labelStyles, ...lineStyles, ...markStyles, ...otherStyles] as Stylesheet[];
};

export default makeCytoscapeStylesheet;
