import {
  BoundingBox12,
  CollectionReturnValue,
  EdgeSingular,
  EventObjectEdge,
  EventObjectNode,
  NodeSingular,
  Position,
} from "cytoscape";

export const ELEMENT_CLASS_MOVE_CONTROL = "element-move-control"; // allow move
export const ELEMENT_SELECTOR_MOVE_CONTROL = `.${ELEMENT_CLASS_MOVE_CONTROL}`;
// Prevent unintentional moves on mouse down drag
export const DX_MOVE_THRESHOLD = 2;
export const DY_MOVE_THRESHOLD = 2;

export function getRelatedLabels(
  elements: CollectionReturnValue,
  isChildDiagLabelMoveSyncEnabled?: boolean,
): CollectionReturnValue {
  const related = elements.cy().collection();
  elements.forEach((ele) => {
    if (ele.isEdge() && ele.data("lineId")) {
      related.merge(`[featureId=${ele.data("lineId")}]`);
    }

    if (ele.isNode() && !isNaN(+ele.id())) {
      related.merge(`[featureId=${ele.id()}]`);
    } else if (
      isChildDiagLabelMoveSyncEnabled &&
      ele.isNode() &&
      (ele.data("labelType") === "childDiagram" || ele.data("labelType") === "childDiagramPage")
    ) {
      // include related childDiagram/childDiagramPage labels
      related.merge(ele.cy().$id(`LAB_${ele.data("featureId")}`));
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

export function isMultiSelectEvent(event: EventObjectEdge | EventObjectNode) {
  return event.originalEvent.ctrlKey || event.originalEvent.shiftKey;
}

export function isMovementOverThreshold(dx: number, dy: number) {
  return Math.abs(dx) > DX_MOVE_THRESHOLD || Math.abs(dy) > DY_MOVE_THRESHOLD;
}

export function addSelectedElemtId(elementId: string, selectedElementIds: string[]) {
  return !selectedElementIds.includes(elementId) ? [...selectedElementIds, elementId] : selectedElementIds;
}

export function replaceSelection(
  previousSelection: CollectionReturnValue | undefined,
  newSelection: CollectionReturnValue,
) {
  const prevSelectionIds = (previousSelection ?? []).map((el) => el.id());
  const newSelectionIds = newSelection.map((el) => el.id());
  return previousSelection?.length === newSelection.length &&
    newSelectionIds.every((item) => prevSelectionIds.includes(item))
    ? previousSelection
    : newSelection;
}

export function areIdsEqual(previousSelection: CollectionReturnValue | undefined, newSelection: CollectionReturnValue) {
  const previousSelectionIds = (previousSelection ?? []).map((el) => el.id());
  const newSelectionIds = newSelection.map((el) => el.id());
  return (
    (previousSelection?.length || 0) === newSelection.length &&
    newSelectionIds.every((item) => previousSelectionIds.includes(item))
  );
}

export function replacePosition(previousPosition: Position | undefined, newPosition: Position | undefined) {
  return arePositionsEqual(previousPosition, newPosition) ? previousPosition : newPosition;
}

export function arePositionsEqual(previousPosition: Position | undefined, newPosition: Position | undefined) {
  return (
    (!previousPosition && !newPosition) ||
    (previousPosition?.x === newPosition?.x && previousPosition?.y === newPosition?.y)
  );
}
