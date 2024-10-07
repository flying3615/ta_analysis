import { CoordinateDTOCoordTypeEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { ElementGroup } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

export interface IGraphData {
  id: string;
  label?: string;
  properties: Record<string, string | number | boolean | undefined>;
  classes?: string | string[];
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
      const isUserDefined = nodeDataEntry.properties["coordType"] === CoordinateDTOCoordTypeEnum.userDefined;
      const nodePositionPixels = isUserDefined
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
        locked: isUserDefined,
        position: nodePositionPixels,
        classes: nodeDataEntry.classes,
      };
    }),
  ];
};

export const getNodeData = (
  node: cytoscape.NodeSingular,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): INodeData => {
  const cyData = node.data();
  const cyStyle = node.style();
  const position = cytoscapeCoordinateMapper.cytoscapeToGroundCoord(node.position(), cyData["diagramId"]);

  const { id, label, ...properties } = cyData;

  // Not needed as there are already font and fontSize properties
  delete properties["font-family"];
  delete properties["font-size"];

  const data = { id, position, properties, classes: node.classes() } as INodeData;

  if (label) {
    data.label = label;
    properties["textRotation"] = cyStyle["text-rotation"].replace("deg", "");
  }
  return data;
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
      classes: edgeDataEntry.classes,
    };
  });
};

export const getEdgeData = (edge: cytoscape.EdgeSingular): IEdgeData => {
  const { id, label, source, target, ...properties } = edge.data();
  return {
    id,
    label,
    sourceNodeId: source,
    destNodeId: target,
    ...properties,
    classes: edge.classes(),
  } as IEdgeData;
};

export const nodePositionsFromData = (
  nodeData: INodeData[],
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): cytoscape.NodePositionMap => {
  return nodeData.reduce((acc, node) => {
    let nodePositionPixels;

    if (node.properties["coordType"] === CoordinateDTOCoordTypeEnum.userDefined) {
      nodePositionPixels = cytoscapeCoordinateMapper.planCoordToCytoscape(node.position);
    } else if (
      node.properties["lineType"] === "userDefined" ||
      node.properties["coordType"] === CoordinateDTOCoordTypeEnum.userDefined ||
      node.properties["labelType"] === LabelDTOLabelTypeEnum.userAnnotation
    ) {
      nodePositionPixels = cytoscapeCoordinateMapper.pageLabelCoordToCytoscape(node.position);
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
