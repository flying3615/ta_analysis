import { ICoordinate, IDiagram } from "@linz/survey-plan-generation-api-client";
import { groupBy } from "lodash-es";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import { SYMBOLS_FONT } from "@/constants";

import { getLineStyling } from "./styling";

export const reconstructDiagrams = (diagrams: IDiagram[], nodeData: INodeData[], edgeData: IEdgeData[]): IDiagram[] => {
  const nodesByDiagramId = groupBy(nodeData, (node) => node.properties["diagramId"]);
  const edgesByDiagramId = groupBy(edgeData, (edge) => edge.properties["diagramId"]);

  return diagrams.map((diagram) => {
    const nodesForDiagram = nodesByDiagramId[diagram.id];
    const edgesForDiagram = edgesByDiagramId[diagram.id];
    if (!nodesForDiagram || !edgesForDiagram) {
      return diagram;
    }

    const filterByElementType = (key: string) => (node: INodeData) => node.properties["elementType"] === key;

    const mapLabels = (node: INodeData) => {
      const isSymbol = node.properties["symbolId"] !== undefined;
      const displayText = isSymbol ? node.properties["symbolId"] : node.label;
      const font = isSymbol ? SYMBOLS_FONT : node.properties["font"];
      return {
        id: parseInt(node.id),
        displayText,
        position: node.position,
        font,
        fontSize: node.properties["fontSize"],
        featureId: node.properties["featureId"],
        featureType: node.properties["featureType"],
        labelType: node.properties["labelType"],
      };
    };

    return {
      ...diagram,
      coordinates: nodesForDiagram.filter(filterByElementType("coordinates")).map((node) => ({
        id: parseInt(node.id),
        coordType: node.properties["coordType"],
        position: node.position as ICoordinate["position"],
      })),
      lines: edgesForDiagram.map((edge) => ({
        id: parseInt(edge.id),
        coordRefs: JSON.parse(edge.properties["coordRefs"] as string),
        lineType: edge.properties["lineType"],
        ...getLineStyling(edge),
      })),
      labels: nodesForDiagram.filter(filterByElementType("labels")).map(mapLabels),
      coordinateLabels: nodesForDiagram.filter(filterByElementType("coordinateLabels")).map(mapLabels),
      lineLabels: nodesForDiagram.filter(filterByElementType("lineLabels")).map(mapLabels),
      parcelLabels: nodesForDiagram.filter(filterByElementType("parcelLabels")).map(mapLabels),
    } as IDiagram;
  });
};
