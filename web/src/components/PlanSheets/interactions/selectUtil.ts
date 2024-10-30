import { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

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
