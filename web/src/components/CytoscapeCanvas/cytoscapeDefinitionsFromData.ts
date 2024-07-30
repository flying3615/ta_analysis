import cytoscape, { ElementGroup } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

export interface IGraphData {
  id: string;
  label?: string;
  properties: Record<string, string | number | boolean | undefined>;
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

export const nodeDefinitionsFromData = (
  data: INodeData[],
  cytoscapeCoordMapper: CytoscapeCoordinateMapper,
): cytoscape.NodeDefinition[] => {
  return [
    { data: { id: "root", label: "" } },
    ...data.map((nodeDataEntry) => {
      const nodePositionPixels =
        nodeDataEntry.properties["coordType"] === "userDefined"
          ? cytoscapeCoordMapper.planCoordToCytoscape(nodeDataEntry.position)
          : { x: 0, y: 0 };

      return {
        group: "nodes" as ElementGroup,
        data: {
          id: nodeDataEntry.id,
          label: nodeDataEntry.label,
          "font-family": nodeDataEntry.properties["font"],
          "font-size": nodeDataEntry.properties["fontSize"],
          ...nodeDataEntry.properties,
        },
        // Note that we need a position here also in order to lock the node position
        locked: nodeDataEntry.properties["coordType"] === "userDefined",
        position: nodePositionPixels,
      };
    }),
  ];
};

export const nodeDataFromDefinitions = (
  nodeDefinitions: cytoscape.NodeDefinition[],
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): INodeData[] => {
  return nodeDefinitions
    .filter((node) => node.data.id !== "root")
    .map((nodeDefinition) => {
      if (!nodeDefinition.position) {
        throw new Error(`nodeDataFromDefinitions: Node ${nodeDefinition.data.id} is missing position`);
      }
      const position = cytoscapeCoordinateMapper.cytoscapeToGroundCoord(
        nodeDefinition.position,
        nodeDefinition.data["diagramId"],
      );

      const { id, label, ...properties } = nodeDefinition.data;

      // Not needed as there are already font and fontSize properties
      delete properties["font-family"];
      delete properties["font-size"];

      const data = { id, position, properties } as INodeData;

      if (label) {
        data.label = label;
      }

      return data;
    });
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

export const edgeDataFromDefinitions = (edgeDefinitions: cytoscape.EdgeDefinition[]): IEdgeData[] => {
  return edgeDefinitions.map((edgeDefinition: cytoscape.EdgeDefinition) => {
    const { id, label, source, target, ...properties } = edgeDefinition.data;
    return {
      id: id,
      label: label,
      sourceNodeId: source,
      destNodeId: target,
      properties: properties,
    } as IEdgeData;
  });
};

export const nodePositionsFromData = (
  nodeData: INodeData[],
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): cytoscape.NodePositionMap => {
  return nodeData.reduce((acc, node) => {
    let nodePositionPixels;

    if (node.properties["coordType"] === "userDefined") {
      nodePositionPixels = cytoscapeCoordinateMapper.planCoordToCytoscape(node.position);
    } else {
      const diagramId = node.properties["diagramId"];
      if (typeof diagramId !== "number") {
        throw new Error(`nodePositionsFromData: Node ${node.id} is missing diagramId in properties`);
      }
      nodePositionPixels = cytoscapeCoordinateMapper.groundCoordToCytoscape(node.position, diagramId);
    }

    return {
      ...acc,
      [node.id]: nodePositionPixels,
    };
  }, {} as cytoscape.NodePositionMap);
};
