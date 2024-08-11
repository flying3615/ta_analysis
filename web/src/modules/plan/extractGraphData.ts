import { IDiagram, ILabel, IPageConfig } from "@linz/survey-plan-generation-api-client";
import { negate } from "lodash-es";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { SYMBOLS_FONT } from "@/constants";

import { getEdgeStyling, getFontColor, getIsCircled, getTextBackgroundOpacity, getZIndex } from "./styling";

export const extractPageNodes = (pageConfigs: IPageConfig[]): INodeData[] => {
  return pageConfigs.flatMap((pageConfig) => {
    const nodes: INodeData[] = pageConfig.coordinates.map((coordinate) => ({
      id: `border_${coordinate.id.toString()}`,
      position: coordinate.position,
      label: "",
      properties: {
        coordType: coordinate.coordType,
        featureId: 1,
        featureType: "",
        font: "Arial",
        labelType: "",
      },
    }));

    // Sort nodes by x (right-most) and y (bottom-most)
    nodes.sort((a, b) => {
      if (a.position.x === b.position.x) {
        return a.position.y - b.position.y;
      }
      return b.position.x - a.position.x;
    });

    const updatedNodes = nodes.map(
      (node) => (node.id === "border_1013" ? { ...node, position: { y: -2.3, x: 39.7 } } : node), // compass
    );

    // If bottomRightNode found, add a new node there for page number overlay
    const bottomRightNode = nodes[1];
    if (bottomRightNode) {
      const createNewNode = (id: string, xOffset: number, yOffset: number, label = ""): INodeData => ({
        id,
        position: {
          x: bottomRightNode.position.x + xOffset,
          y: bottomRightNode.position.y + yOffset,
        },
        label,
        properties: bottomRightNode.properties,
      });

      updatedNodes.push(createNewNode("border_page_no0", 0, 1));
      updatedNodes.push(createNewNode("border_page_no1", -2, 1));
      updatedNodes.push(createNewNode("border_page_no2", -2, 0));
      updatedNodes.push(createNewNode("border_page_no", -1, 0.5, "T/1"));
    }

    return updatedNodes;
  });
};

export const extractPageEdges = (pageConfigs: IPageConfig[]): IEdgeData[] => {
  return pageConfigs.flatMap((pageConfig) => {
    const pageLines = pageConfig.lines
      .filter((line) => line.coordRefs?.[0] && line.coordRefs?.[1])
      .map(
        (line) =>
          ({
            id: `border_${line.id.toString()}`,
            sourceNodeId: `border_${line.coordRefs?.[0]?.toString()}`,
            destNodeId: `border_${line.coordRefs?.[1]?.toString()}`,
            properties: {
              pointWidth: line.pointWidth ?? 1,
            },
          }) as IEdgeData,
      );

    const createNewLine = (id: string, sourceNodeId: string, destNodeId: string): IEdgeData => ({
      id,
      sourceNodeId,
      destNodeId,
      properties: {
        pointWidth: 1,
      },
    });

    pageLines.push(
      createNewLine("border_9999", "border_page_no0", "border_page_no1"),
      createNewLine("border_99999", "border_page_no1", "border_page_no2"),
    );

    return pageLines;
  });
};

export const extractDiagramNodes = (diagrams: IDiagram[]): INodeData[] => {
  const isSymbol = (label: ILabel) => label.font === SYMBOLS_FONT;
  const notSymbol = negate(isSymbol);

  return diagrams.flatMap((diagram) => {
    const labelToNode = (label: ILabel): INodeData => {
      return {
        id: label.id.toString(),
        position: label.position,
        label: label.displayText,
        properties: {
          labelType: label.labelType,
          font: label.font,
          fontSize: label.fontSize ?? 10,
          fontStyle: label.fontStyle,
          fontColor: getFontColor(label),
          zIndex: getZIndex(label),
          circled: getIsCircled(label),
          textBackgroundOpacity: getTextBackgroundOpacity(label),
          textBorderOpacity: label.borderWidth ? 1 : 0,
          textBorderWidth: label.borderWidth ?? 0,
          textRotation: label.rotationAngle,
          anchorAngle: label.anchorAngle,
          pointOffset: label.pointOffset,
          textAlignment: label.textAlignment,
          borderWidth: label.borderWidth,
          displayState: label.displayState,
          featureId: label.featureId,
          featureType: label.featureType,
          diagramId: diagram.id,
          ...(isSymbol(label) && { symbolId: label.displayText }),
        },
      };
    };

    const addDiagramKey =
      (elementType: INodeData["properties"]["elementType"]) =>
      (node: INodeData): INodeData => {
        node.properties["elementType"] = elementType;
        return node;
      };

    // check if diagramType starts with "userDefn" otherwise skip it
    const isUserDefnDiagram = (diagramType: string): boolean => {
      return diagramType.startsWith("userDefn");
    };
    const userDefnLabels = isUserDefnDiagram(diagram.diagramType)
      ? diagram.labels.filter(notSymbol).map(labelToNode).map(addDiagramKey("labels"))
      : [];

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
      ...userDefnLabels,
      ...(diagram.childDiagrams?.flatMap((childDiagram) =>
        childDiagram?.labels?.map(labelToNode)?.map(addDiagramKey("childDiagramLabels")),
      ) ?? []),
      ...diagram.coordinateLabels.map(labelToNode).map(addDiagramKey("coordinateLabels")),
      ...diagram.lineLabels.filter(notSymbol).map(labelToNode).map(addDiagramKey("lineLabels")),
      ...diagram.parcelLabels
        .filter(notSymbol)

        .map(labelToNode)
        .map(addDiagramKey("parcelLabels")),
    ];
  });
};

export const extractDiagramEdges = (diagrams: IDiagram[]): IEdgeData[] => {
  return diagrams.flatMap((diagram) => {
    return diagram.lines
      .filter((line) => line.coordRefs?.[0] && line.coordRefs?.[1])
      .map((line) => {
        return {
          id: line.id.toString(),
          sourceNodeId: line.coordRefs?.[0]?.toString(),
          destNodeId: line.coordRefs?.[1]?.toString(),
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
