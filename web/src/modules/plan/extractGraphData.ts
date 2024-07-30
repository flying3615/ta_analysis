import { IDiagram, ILabel } from "@linz/survey-plan-generation-api-client";
import { negate } from "lodash-es";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import { SYMBOLS_FONT } from "@/constants";

import { getEdgeStyling } from "./styling";

const LABEL_EFFECT_HALO = "halo";

export const extractNodes = (diagrams: IDiagram[]): INodeData[] => {
  return diagrams.flatMap((diagram, diagramIndex) => {
    const labelToNode = (label: ILabel) => {
      return {
        id: label.id.toString(),
        position: label.position,
        label: label.displayText,
        properties: {
          labelType: label.labelType,
          font: label.font,
          fontSize: label.fontSize,
          fontStyle: label.fontStyle,
          fontColor: ["hide", "systemHide"].includes(label.displayState) ? "#C0C0C0" : "black",
          circled: label.symbolType === "circle" ? 1 : undefined,
          textBackgroundOpacity: label.effect === LABEL_EFFECT_HALO ? 1 : 0,
          textBorderOpacity: label.borderWidth ? 1 : 0,
          textBorderWidth: label.borderWidth,
          textRotation: label.rotationAngle,
          anchorAngle: label.anchorAngle,
          pointOffset: label.pointOffset,
          textAlignment: label.textAlignment,
          borderWidth: label.borderWidth,
          featureId: label.featureId,
          featureType: label.featureType,
          diagramId: diagram.id,
          ...(isSymbol(label) && { symbolId: label.displayText }),
        },
      };
    };

    const symbolToNode = (label: ILabel) => {
      return {
        id: label.id.toString(),
        position: label.position,
        label: label.displayText,
        diagramIndex,
        properties: {
          symbolId: label.displayText,
          diagramId: diagram.id,
        },
      };
    };

    const addDiagramKey =
      (elementType: string) =>
      (node: INodeData): INodeData => {
        node.properties["elementType"] = elementType;
        return node;
      };

    const isSymbol = (label: ILabel) => label.font === SYMBOLS_FONT;
    const notSymbol = negate(isSymbol);

    return [
      ...(diagram.coordinates.map((coordinate) => {
        return {
          id: coordinate.id.toString(),
          position: coordinate.position,
          properties: {
            coordType: coordinate.coordType,
            diagramId: diagram.id,
            elementType: "coordinates",
          },
        };
      }) as INodeData[]),
      ...diagram.labels.filter(notSymbol).map(labelToNode).map(addDiagramKey("labels")),
      ...diagram.coordinateLabels
        .filter(notSymbol)

        .map(labelToNode)
        .map(addDiagramKey("coordinateLabels")),
      ...diagram.coordinateLabels
        .filter(isSymbol)

        .map(symbolToNode)
        .map(addDiagramKey("coordinateLabels")),
      ...diagram.lineLabels.filter(notSymbol).map(labelToNode).map(addDiagramKey("lineLabels")),
      ...diagram.parcelLabels
        .filter(notSymbol)

        .map(labelToNode)
        .map(addDiagramKey("parcelLabels")),
    ];
  });
};

export const extractEdges = (diagrams: IDiagram[]): IEdgeData[] => {
  return diagrams.flatMap((diagram) => {
    return diagram.lines
      .filter((line) => line.coordRefs[0] && line.coordRefs[1])
      .map((line) => {
        return {
          id: line.id.toString(),
          sourceNodeId: line.coordRefs[0]?.toString(),
          destNodeId: line.coordRefs[1]?.toString(),
          properties: {
            ...getEdgeStyling(line),
            diagramId: diagram.id,
            elementType: "lines",
            lineType: line.lineType,
            coordRefs: JSON.stringify(line.coordRefs),
          },
        } as IEdgeData;
      });
  });
};
