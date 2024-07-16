import cytoscape, { ElementGroup } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

interface IGraphData {
  id: string;
  label?: string;
  diagramIndex: number;
  properties: Record<string, string | number | undefined>;
}

export interface GroundMetresPosition {
  x: number;
  y: number;
}

export interface INodeData extends IGraphData {
  image?: string;
  position: GroundMetresPosition;
}

export interface IEdgeData extends IGraphData {
  sourceNodeId: string;
  destNodeId: string;
}

export const nodeDefinitionsFromData = (data: INodeData[]): cytoscape.NodeDefinition[] => {
  return [
    { data: { id: "root", label: "" } },
    ...data.map((nodeDataEntry) => {
      return {
        group: "nodes" as ElementGroup,
        data: {
          id: nodeDataEntry.id,
          label: nodeDataEntry.label,
          "font-family": nodeDataEntry.properties["font"],
          "font-size": nodeDataEntry.properties["fontSize"],
          ...nodeDataEntry.properties,
        },
      };
    }),
  ];
};

export const edgeDefinitionsFromData = (data: IEdgeData[]): cytoscape.EdgeDefinition[] => {
  return data.map((edgeDataEntry: IEdgeData) => {
    return {
      group: "edges" as ElementGroup,
      data: {
        id: edgeDataEntry.id,
        label: edgeDataEntry.label,
        source: edgeDataEntry.sourceNodeId,
        target: edgeDataEntry.destNodeId,
        textRotation: "autorotate",
        ...edgeDataEntry.properties,
      },
    };
  });
};

export const nodePositionsFromData = (
  nodeData: INodeData[],
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): cytoscape.NodePositionMap => {
  return nodeData.reduce((acc, node) => {
    const nodePositionPixels = cytoscapeCoordinateMapper.groundCoordToCytoscape(node.position, node.diagramIndex);
    return {
      ...acc,
      [`${node.id}`]: nodePositionPixels,
    };
  }, {});
};
