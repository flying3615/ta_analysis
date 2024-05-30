import cytoscape, { ElementGroup } from "cytoscape";
import { IDiagram } from "@linz/survey-plan-generation-api-client";

interface IGraphData {
  id: string;
  label?: string;
  diagramIndex: number;
  properties: Record<string, string | number | undefined>;
}

export interface INodeData extends IGraphData {
  image?: string;
  position: { x: number; y: number };
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

// These are taken from PageConfig in the XML and are thought to be hardcoded in SQL
// they define the page size in cm
// I have kept to the legacy names here
const diagramLimitOriginX = 1.5;
const diagramLimitOriginY = -1.5;
const diagramLimitBottomRightX = 40.5;
const diagramLimitBottomRightY = -26.2;

export const nodePositionsFromData = (
  nodeData: INodeData[],
  viewport: { width: number; height: number },
  diagrams: IDiagram[],
): cytoscape.NodePositionMap => {
  // The diagram limit is actually the page size in cm.
  const diagramWidth = diagramLimitBottomRightX - diagramLimitOriginX;
  const diagramHeight = diagramLimitBottomRightY - diagramLimitOriginY;
  // Scales are in pixels per centimetre
  const scaleX = viewport.width / diagramWidth;
  const scaleY = viewport.height / diagramHeight;

  // We want to scale the page to fit within the viewpoet whilst maintaining the
  // shape of the plan - so we have the same scale for X and Y.
  // The controlling factor is the axis with least room to fit
  // (which might be the shorter of the two where e.g the diagram is 'wide' and
  // the window is 'tall')
  // We find this axis from the scale with the smallest magnitude => less pixels per cm
  // and we apply an offset to centre the page in the other axis.
  let scale;
  let offsetX = 0;
  let offsetY = 0;
  if (Math.abs(scaleX) > Math.abs(scaleY)) {
    scale = scaleY;
    offsetX = (viewport.width - diagramWidth * Math.abs(scale)) / 2;
  } else {
    scale = scaleX;
    offsetY = (viewport.height - Math.abs(diagramHeight) * Math.abs(scale)) / 2;
  }

  return nodeData.reduce((acc, node) => {
    // We now want to scale each diagrams points into page coordinates
    // To do this we find the limits of out diagram and compute the scale
    // (again based on the longest side) in diagram coordinates per page coordinate
    const diagram = diagrams[node.diagramIndex];
    if (!diagram) throw Error(`Mark ${node.label} is on unknown diagram ${node.diagramIndex}`);
    const diagramScaleX = (diagram.originPageOffset.x - diagram.originPageOffset.x) / diagramWidth;
    const diagramScaleY = (diagram.bottomRightPoint.y - diagram.originPageOffset.y) / diagramHeight;
    const diagramScale = Math.max(diagramScaleX, diagramScaleY);

    // Now we scale and offset the point into pixels => calculate the page cm and multiply by the
    // scale in pixels per cm to get final pixels
    return {
      ...acc,
      [`${node.id}`]: {
        x:
          ((node.position?.x - (diagram.originPageOffset.x + diagramLimitOriginX)) * Math.abs(scale)) / diagramScale +
          offsetX,
        y:
          ((node.position?.y - (diagram.originPageOffset.y + diagramLimitOriginY)) * -Math.abs(scale)) / diagramScale +
          offsetY,
      },
    };
  }, {});
};
