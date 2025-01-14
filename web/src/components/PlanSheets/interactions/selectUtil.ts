import { BoundingBox12, CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

export function getRelatedLabels(elements: CollectionReturnValue): CollectionReturnValue {
  const related = elements.cy().collection();
  elements.forEach((ele) => {
    if (ele.isEdge() && ele.data("lineId")) {
      related.merge(`[featureId=${ele.data("lineId")}]`);
    }
    if (ele.isNode() && !isNaN(+ele.id())) {
      related.merge(`[featureId=${ele.id()}]`);
    }
  });
  return related;
}

export function getRelatedElements(ele: EdgeSingular | NodeSingular): CollectionReturnValue | undefined {
  if (ele.isEdge() && ele.data("lineId")) {
    // include related broken/irregular segments
    return ele.cy().$(`edge[lineId='${ele.data("lineId")}']`);
  }

  const featureId = ele.data("featureId") as string;
  const symbolId = ele.data("symbolId") as string;

  if (ele.isNode() && featureId && symbolId) {
    // include coordinate for symbol
    return ele.cy().$id(featureId);
  }

  return;
}

/**
 * Find start and end nodes of a single/multi-segment line.
 * @param edge
 */
export function findStartEndNodesForLine(edge: EdgeSingular): {
  startNode: NodeSingular | null;
  endNode: NodeSingular | null;
} {
  const allLines = getRelatedElements(edge);
  if (!allLines) {
    return { startNode: null, endNode: null };
  }

  const nodeConnectionCount: { [key: string]: number } = {};

  allLines.forEach((line) => {
    const sourceNodeId = line.source().id();
    const targetNodeId = line.target().id();

    nodeConnectionCount[sourceNodeId] = (nodeConnectionCount[sourceNodeId] || 0) + 1;
    nodeConnectionCount[targetNodeId] = (nodeConnectionCount[targetNodeId] || 0) + 1;
  });

  let startNode: NodeSingular | null = null;
  let endNode: NodeSingular | null = null;

  allLines.forEach((line) => {
    const sourceNode = line.source();
    const targetNode = line.target();

    if (nodeConnectionCount[sourceNode.id()] === 1) {
      startNode = sourceNode;
    }

    if (nodeConnectionCount[targetNode.id()] === 1) {
      endNode = targetNode;
    }
  });

  return { startNode, endNode };
}

export function getMoveElementsExtent(selectedElements: CollectionReturnValue): BoundingBox12 {
  let x1 = 0;
  let y1 = 0;
  let x2 = 0;
  let y2 = 0;
  selectedElements.forEach((ele) => {
    if (ele.isEdge()) {
      const boundingBox = ele.boundingBox();
      if (x1 === 0 || boundingBox.x1 < x1) {
        x1 = boundingBox.x1;
      }
      if (y1 === 0 || boundingBox.y1 < y1) {
        y1 = boundingBox.y1;
      }
      if (x2 === 0 || boundingBox.x2 > x2) {
        x2 = boundingBox.x2;
      }
      if (y2 === 0 || boundingBox.y2 > y2) {
        y2 = boundingBox.y2;
      }
    }

    // Need to have a specialized method to calculate the bounding box of a page line because in our app we don't
    // want the "selected node circle" to be included in the bounding box, but Cytoscape doesn't know that and
    // thinks it should be included.
    if (ele.isNode()) {
      const position = ele.position();
      if (x1 === 0 || position.x < x1) {
        x1 = position.x;
      }
      if (y1 === 0 || position.y < y1) {
        y1 = position.y;
      }
      if (x2 === 0 || position.x > x2) {
        x2 = position.x;
      }
      if (y2 === 0 || position.y > y2) {
        y2 = position.y;
      }
    }
  });
  return { x1, y1, x2, y2 };
}
