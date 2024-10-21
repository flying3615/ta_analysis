import { BoundingBox12, EdgeSingular, NodeSingular } from "cytoscape";
import { compact, uniq } from "lodash-es";

import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";

export interface PageEdgeData {
  id: string;
  boundingBox: BoundingBox12;
}

export interface PageNodeData {
  id: string;
  position: { x: number; y: number };
}

export const calculatePreviousDiagramAttributes = (
  diagramId: string,
  diagramPoints: BoundingBox12,
  pageLineEdges: PageEdgeData[],
  pageLabelNodes: PageNodeData[],
): PreviousDiagramAttributes => {
  const affectedLabels = pageLabelNodes
    .filter((node) => {
      return withinBounds({ x: node.position.x, y: node.position.y }, diagramPoints);
    })
    .map((node) => ({
      id: node.id,
    }));
  const affectedLinesIds = pageLineEdges
    .filter((edge) => overlapOfBounds(diagramPoints, edge.boundingBox))
    .map((edge) => edge.id.split("_")[0]);
  const affectedLines = uniq(compact(affectedLinesIds)).map((id) => ({ id }));

  return {
    id: diagramId,
    linesAffectedByLastMove: affectedLines,
    labelsAffectedByLastMove: affectedLabels,
  };
};

const withinBounds = (point: { x: number; y: number }, bounds: BoundingBox12) => {
  return point.x >= bounds.x1 && point.x <= bounds.x2 && point.y >= bounds.y1 && point.y <= bounds.y2;
};
const overlapOfBounds = (diagramBounds: BoundingBox12, otherBounds: BoundingBox12) => {
  return !(
    diagramBounds.y1 > otherBounds.y2 ||
    diagramBounds.y2 < otherBounds.y1 ||
    diagramBounds.x1 > otherBounds.x2 ||
    diagramBounds.x2 < otherBounds.x1
  );
};

export const edgeSingularToEdgeData = (edge: EdgeSingular): PageEdgeData => {
  return {
    id: edge.id(),
    boundingBox: { ...edge.boundingBox() },
  };
};

export const nodeSingularToNodeData = (node: NodeSingular): PageNodeData => {
  return {
    id: node.id(),
    position: { ...node.position() },
  };
};
