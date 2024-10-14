import { CoordinateDTOCoordTypeEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { ElementGroup } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { nodeSingular } from "@/test-utils/cytoscape-utils";

import { calculateTextAlignmentPolar, rotatedMargin, textDimensions, textRotationMathRads } from "./styleNodeMethods";

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

export interface INodeAndEdgeData {
  edges: IEdgeData[];
  nodes: INodeData[];
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
  const diagramId = cyData["diagramId"];

  const position = diagramId
    ? cytoscapeCoordinateMapper.cytoscapeToGroundCoord(node.position(), diagramId)
    : cytoscapeCoordinateMapper.pageLabelCytoscapeToCoord(node.position());

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
    properties,
    classes: edge.classes(),
  } as IEdgeData;
};

const diagramLabelNodePositioner = (
  node: INodeData,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
  nodePositionPixels: cytoscape.Position,
) => {
  const ele = nodeSingular({ ...node.properties, label: node.label! }, node.position);
  let rotationRads = textRotationMathRads(ele);
  if (isNaN(rotationRads)) {
    rotationRads = 0;
  }

  //textAlignment adjustment
  const textDim = textDimensions(ele, cytoscapeCoordinateMapper);
  const { textRadiusDist, textThetaRads } = calculateTextAlignmentPolar(textDim, ele);

  const horizontalAlignmentOffset = textRadiusDist * Math.cos(rotationRads + textThetaRads);
  const verticalAlignmentOffset = -(textRadiusDist * Math.sin(rotationRads + textThetaRads));

  nodePositionPixels.x -= horizontalAlignmentOffset;
  nodePositionPixels.y -= verticalAlignmentOffset;

  //anchorAngle/pointOffset adjustment
  const offsetMargin = rotatedMargin(ele, cytoscapeCoordinateMapper);

  nodePositionPixels.x += offsetMargin.x;
  nodePositionPixels.y += offsetMargin.y;
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
      //for diagram labels, we want the node to be positioned in the middle of the label
      if (node.label && node.properties["textAlignment"]) {
        diagramLabelNodePositioner(node, cytoscapeCoordinateMapper, nodePositionPixels);
      }
    }

    return {
      ...acc,
      [node.id]: nodePositionPixels,
    };
  }, {} as cytoscape.NodePositionMap);
};
