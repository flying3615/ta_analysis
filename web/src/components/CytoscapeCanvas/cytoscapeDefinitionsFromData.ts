import {
  CoordinateDTOCoordTypeEnum,
  DisplayStateEnum,
  LabelDTOLabelTypeEnum,
} from "@linz/survey-plan-generation-api-client";
import cytoscape, { ElementGroup } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { toDisplayFont } from "@/components/CytoscapeCanvas/fontDisplayFunctions";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { BROKEN_LINE_COORD } from "@/modules/plan/extractGraphData";
import { nodeSingular } from "@/test-utils/cytoscape-utils";
import { midPoint, Position, subtractIntoDelta } from "@/util/positionUtil";

import { calculateTextAlignmentPolar, rotatedMargin, textDimensions, textRotationMathRads } from "./styleNodeMethods";

// common properties
export interface IGraphDataProperties extends Record<string, unknown> {
  diagramId?: number;
  displayState?: DisplayStateEnum;
  elementType?: PlanElementType;
  featureId?: number;
  featureType?: string;
  id?: string;
  invisible?: boolean;
  label?: string;
  lineId?: string;
  lineType?: string;
  locked?: boolean;
  parent?: string;
  zIndex?: number;
}

export interface IEdgeDataProperties extends IGraphDataProperties {
  [BROKEN_LINE_COORD]?: string;
  coordRefs?: string;
  pointWidth?: number;
  source?: string;
  target?: string;
}

export interface INodeDataProperties extends IGraphDataProperties {
  anchorAngle?: number;
  borderWidth?: number;
  circled?: number;
  coordType?: CoordinateDTOCoordTypeEnum;
  font?: string;
  fontColor?: string;
  fontSize?: number;
  fontStyle?: string;
  labelType?: LabelDTOLabelTypeEnum;
  offsetX?: number;
  offsetY?: number;
  pointOffset?: number;
  symbolId?: string;
  textAlignment?: string;
  textBackgroundOpacity?: number;
  textBorderOpacity?: number;
  textBorderWidth?: number;
  textBackgroundPadding?: number;
  textRotation?: number;
  displayFormat?: string;
}

export interface IDiagramNodeDataProperties extends INodeDataProperties {
  diagramId: number;
  elementType: PlanElementType.DIAGRAM;
  bottomRightX: number;
  bottomRightY: number;
  originPageX: number;
  originPageY: number;
  zoomScale: number;
}

export interface IGraphData {
  id: string;
  label?: string;
  properties: IGraphDataProperties;
  classes?: string | string[];
}

export interface GroundMetresPosition extends Position {}

export interface INodeData extends IGraphData {
  image?: string;
  position: GroundMetresPosition;
  properties: INodeDataProperties;
}

export interface IEdgeData extends IGraphData {
  sourceNodeId: string;
  destNodeId: string;
  properties: IEdgeDataProperties;
}

export interface IDiagramNodeData extends INodeData {
  properties: IDiagramNodeDataProperties;
}

export interface INodeAndEdgeData {
  edges: IEdgeData[];
  nodes: INodeData[];
}

const makeDiagramSelectionNodeDefinition = (
  cytoscapeCoordMapper: CytoscapeCoordinateMapper,
  diagramNodeProperties: IDiagramNodeDataProperties,
  nodeDataEntry: INodeData,
) => {
  const diagramBottomRightPixels = cytoscapeCoordMapper.groundCoordToCytoscape(
    {
      x: diagramNodeProperties.bottomRightX,
      y: diagramNodeProperties.bottomRightY,
    },
    diagramNodeProperties.diagramId,
  );
  const diagramOriginPixels = cytoscapeCoordMapper.planCoordToCytoscape({
    x: diagramNodeProperties.originPageX * 100,
    y: diagramNodeProperties.originPageY * 100,
  });

  const { dx: width, dy: height } = subtractIntoDelta(diagramBottomRightPixels, diagramOriginPixels);
  const position = midPoint(diagramBottomRightPixels, diagramOriginPixels);

  return {
    group: "nodes" as ElementGroup,
    data: {
      ...diagramNodeProperties,
      id: nodeDataEntry.id,
      width,
      height,
    },
    position,
  };
};

export const nodeDefinitionsFromData = (
  data: INodeData[],
  cytoscapeCoordMapper: CytoscapeCoordinateMapper,
): cytoscape.NodeDefinition[] => {
  return [
    { data: { id: "root", label: "" } },
    ...data.map((nodeDataEntry) => {
      const diagramNodeProperties = nodeDataEntry.properties as IDiagramNodeDataProperties;
      if (diagramNodeProperties.elementType === PlanElementType.DIAGRAM) {
        return makeDiagramSelectionNodeDefinition(cytoscapeCoordMapper, diagramNodeProperties, nodeDataEntry);
      }

      const nodePositionPixels = nodePositionFromData(nodeDataEntry, cytoscapeCoordMapper);
      return {
        group: "nodes" as ElementGroup,
        data: {
          id: nodeDataEntry.id,
          label: nodeDataEntry.label,
          "font-family": toDisplayFont(nodeDataEntry.properties.font),
          "font-size": nodeDataEntry.properties.fontSize,
          font: toDisplayFont(nodeDataEntry.properties.font),
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
  const cyData = node.data() as INodeDataProperties;
  const diagramId = cyData.diagramId;

  let position = { ...node.position() };
  if (cyData.offsetX || cyData.offsetY) {
    // remove any offset made during nodePositionFromData
    position.x -= cyData.offsetX ?? 0;
    position.y -= cyData.offsetY ?? 0;
  }
  position = diagramId
    ? cytoscapeCoordinateMapper.cytoscapeToGroundCoord(position, diagramId)
    : cytoscapeCoordinateMapper.pageLabelCytoscapeToCoord(position);

  const { id, label, ...properties } = cyData;

  // Not needed as there are already font and fontSize properties
  delete properties["font-family"];
  delete properties["font-size"];

  const data = { id, position, properties, classes: node.classes() } as INodeData;

  if (label) {
    data.label = label;
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
  const { id, label, source, target, ...properties } = edge.data() as IEdgeDataProperties;
  return {
    id,
    label,
    sourceNodeId: source,
    destNodeId: target,
    properties,
    classes: edge.classes(),
  } as IEdgeData;
};

const labelNodePositioner = (
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

export const nodePositionFromData = (
  node: INodeData,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): cytoscape.Position => {
  let nodePositionPixels;

  if (node.properties.coordType === CoordinateDTOCoordTypeEnum.userDefined) {
    nodePositionPixels = cytoscapeCoordinateMapper.planCoordToCytoscape(node.position);
  } else if (
    node.properties.lineType === CoordinateDTOCoordTypeEnum.userDefined ||
    node.properties.labelType === LabelDTOLabelTypeEnum.userAnnotation
  ) {
    nodePositionPixels = cytoscapeCoordinateMapper.pageLabelCoordToCytoscape(node.position);
  } else {
    const diagramId = node.properties.diagramId;
    if (!diagramId) {
      throw new Error(`nodePositionsFromData: Node ${node.id} is missing diagramId in properties`);
    }
    nodePositionPixels = cytoscapeCoordinateMapper.groundCoordToCytoscape(node.position, diagramId);
  }

  if (node.label && node.properties.textAlignment && !node.properties.symbolId) {
    const { x, y } = { ...nodePositionPixels };
    labelNodePositioner(node, cytoscapeCoordinateMapper, nodePositionPixels);
    node.properties.offsetX = nodePositionPixels.x - x;
    node.properties.offsetY = nodePositionPixels.y - y;
  }

  return nodePositionPixels;
};

export const nodePositionsFromData = (
  nodeData: INodeData[],
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): cytoscape.NodePositionMap => {
  return nodeData.reduce((acc, node) => {
    const nodePositionPixels = nodePositionFromData(node, cytoscapeCoordinateMapper);
    return {
      ...acc,
      [node.id]: nodePositionPixels,
    };
  }, {} as cytoscape.NodePositionMap);
};
