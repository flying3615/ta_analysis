import "./MoveSelectedHandler.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import {
  BoundingBox12,
  CollectionReturnValue,
  EdgeDefinition,
  ElementDefinition,
  EventObjectEdge,
  EventObjectNode,
  InputEventObject,
  NodeDefinition,
  Position,
  SingularElementReturnValue,
} from "cytoscape";
import { useEffect } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { BROKEN_LINE_COORD } from "@/modules/plan/extractGraphData";

import { moveExtent } from "./moveAndResizeUtil";
import { getRelatedLabels } from "./selectUtil";

export interface SelectedElementProps {
  diagrams: DiagramDTO[];
  selectedElements: CollectionReturnValue;
}

// for cursor
const CONTAINER_CLASS_MOVABLE = "element-movable";
const CONTAINER_CLASS_MOVING = "element-moving";

const ELEMENT_CLASS_MOVE_CONTROL = "element-move-control"; // allow move
const ELEMENT_CLASS_MOVE_HIDE = "transparent"; // do not show
const ELEMENT_CLASS_MOVE_VECTOR = "element-move-vector"; // vector showing movement

const ELEMENT_SELECTOR_MOVE_CONTROL = `.${ELEMENT_CLASS_MOVE_CONTROL}`;

/**
 * MoveSelectedHandler allows user to move selected elements.
 *
 * A class is added to selectedElements and used to manage listeners
 * for beginMove(mousedown), updateMove(mousemove), and endMove(mouseup)
 *
 * When move is complete a collection of all edges/nodes affected by the move is built
 * and updateMovedElements() makes any additional changes (eventually re-align labels)
 * before "collection:changed" event is emitted.
 *
 * Internal design:
 *
 * - selectedElements are the move controls; and use mouse events to manage constrained move.
 *   > this allows selection to change/expand externally.
 *   > different from diagrams, which are groupings that require custom controls.
 *
 * - when move starts, add "controls" to show move UX
 *   - duplicated original elements at initial position, since original elements move
 *   - move vector from (source) initial positions to (target) moved positions
 *
 * - when move ends, remove controls, emit a bulk change event.
 *
 * - adjacent edges are different
 *   - hide the original elements during move (via class ".transparent")*
 *   - duplicate original elements, but connected to ("control") initial position
 *     > because the original element is connected to a moving node.
 *   - move vector from fixed node to moving node
 *     > broken lines are also different
 *
 * @param elements
 *   selected elements that when clicked can start the move.
 *
 */
export function MoveSelectedHandler({ diagrams, selectedElements }: SelectedElementProps) {
  useEffect(() => {
    const cyto = selectedElements.cy();
    const container = cyto.container();
    if (!container) {
      return;
    }

    const cytoCoordMapper = new CytoscapeCoordinateMapper(container, diagrams);
    const diagramAreaLimits = cytoCoordMapper.getDiagramOuterLimitsPx();
    // move selected, connected nodes, and related labels
    const movingElements = selectedElements.union(selectedElements.connectedNodes());
    movingElements.merge(getRelatedLabels(movingElements));
    const adjacentEdges = movingElements.connectedEdges().difference(movingElements);

    let moveControls: CollectionReturnValue | undefined;
    let moveElementsExtent: BoundingBox12 | undefined;
    let moveStart: Position | undefined;
    let moveStartPositions: Record<string, Position> | undefined;
    let moveLocation: SingularElementReturnValue | undefined;

    const addContainerClass = () => {
      container.classList.add(CONTAINER_CLASS_MOVABLE);
    };

    const beginMove = (event: EventObjectNode | EventObjectEdge) => {
      moveControls = cyto.add(getMoveControlElements(event, movingElements, adjacentEdges));
      // set extent based on selection, not related
      moveElementsExtent = selectedElements.boundingBox();
      moveLocation = moveControls.$id("theMoveLocation");
      moveStart = event.position;
      moveStartPositions = getPositions(movingElements.union(adjacentEdges));

      adjacentEdges.addClass(ELEMENT_CLASS_MOVE_HIDE);
      container.classList.add(CONTAINER_CLASS_MOVING);
      cyto.boxSelectionEnabled(false);
      cyto.userPanningEnabled(false);
      cyto.on("mousemove", updateMove);
      cyto.on("mouseup", endMove);
    };

    const cleanupMove = () => {
      adjacentEdges.removeClass(ELEMENT_CLASS_MOVE_HIDE);
      container.classList.remove(CONTAINER_CLASS_MOVING);
      cyto.boxSelectionEnabled(true);
      cyto.userPanningEnabled(true);
      cyto.off("mousemove", updateMove);
      cyto.off("mouseup", endMove);
      if (moveControls) {
        cyto.remove(moveControls);
      }

      moveControls = undefined;
      moveElementsExtent = undefined;
      moveLocation = undefined;
      moveStart = undefined;
      moveStartPositions = undefined;
    };

    const endMove = (event: InputEventObject) => {
      if (updateMove(event)) {
        let movedElements = movingElements;
        if (moveStartPositions) {
          movedElements = updateMovedElements(movedElements, adjacentEdges, moveStartPositions);
          // TODO: ensure elements within bounds
        }
        cyto.emit("collection:changed", [movedElements]);
      }
      cleanupMove();
    };

    const removeContainerClass = () => {
      if (moveStart) {
        return;
      }
      container.classList.remove(CONTAINER_CLASS_MOVABLE);
    };

    /**
     * @param active diagram move/resize position event.
     * @returns Position representing (page-constrained) dx/dy move vector.
     */
    const updateMove = (event: InputEventObject): Position | undefined => {
      if (!moveElementsExtent || !moveLocation || !moveStart || !moveStartPositions) {
        return;
      }

      const newExtent = moveExtent(
        moveElementsExtent,
        event.position.x - moveStart.x,
        event.position.y - moveStart.y,
        diagramAreaLimits,
      );
      const dx = newExtent.x1 - moveElementsExtent.x1;
      const dy = newExtent.y1 - moveElementsExtent.y1;
      moveLocation.position({ x: moveStart.x + dx, y: moveStart.y + dy });
      setPositions(movingElements, moveStartPositions, dx, dy);

      if (dx === 0 && dy === 0) {
        // no move
        return;
      }
      return { x: dx, y: dy };
    };

    addContainerClass();
    selectedElements.addClass(ELEMENT_CLASS_MOVE_CONTROL).ungrabify().style("events", "yes");

    cyto.on("mousedown", ELEMENT_SELECTOR_MOVE_CONTROL, beginMove);
    cyto.on("mouseout", ELEMENT_SELECTOR_MOVE_CONTROL, removeContainerClass);
    cyto.on("mouseover", ELEMENT_SELECTOR_MOVE_CONTROL, addContainerClass);

    return () => {
      cleanupMove();

      cyto.off("mousedown", ELEMENT_SELECTOR_MOVE_CONTROL, beginMove);
      cyto.off("mouseout", ELEMENT_SELECTOR_MOVE_CONTROL, removeContainerClass);
      cyto.off("mouseover", ELEMENT_SELECTOR_MOVE_CONTROL, addContainerClass);

      selectedElements.removeClass(ELEMENT_CLASS_MOVE_CONTROL).grabify().style("events", "no");
      removeContainerClass();
    };
  });

  return <></>;
}

/**
 * Selected elements are the controls used for moving,
 * but need to display the original location and move vectors.
 *
 *   - copy of all moving elements that remains fixed (and unselected)
 *   - move vectors showing relative coordinate/edge motion
 *   - active move vector
 *     - if move starts on mark, highlight mark move vector
 *     - if move starts on line, create move vector from initial position

 * @param elements
 *   collection of elements being moved.
 * @returns
 *   collection of move controls.
 */
function getMoveControlElements(
  startEvent: EventObjectEdge | EventObjectNode,
  movingElements: CollectionReturnValue,
  adjacentEdges: CollectionReturnValue,
): ElementDefinition[] {
  const controlEdges: EdgeDefinition[] = [];
  const controlNodes: NodeDefinition[] = [];

  // vector showing start/end of move
  controlNodes.push(
    {
      group: "nodes",
      data: { id: "theMoveStart" },
      position: { ...startEvent.position },
      classes: [ELEMENT_CLASS_MOVE_HIDE],
    },
    {
      group: "nodes",
      data: { id: "theMoveLocation" },
      position: { ...startEvent.position },
      classes: [ELEMENT_CLASS_MOVE_HIDE],
    },
  );
  controlEdges.push({
    group: "edges",
    data: { id: "theMoveVector", source: "theMoveStart", target: "theMoveLocation" },
    classes: [ELEMENT_CLASS_MOVE_VECTOR],
  });

  // clone moving elements, adding move vectors to show change
  movingElements.forEach((ele) => {
    const id = ele.id();
    const controlId = `moveStart${id}`;

    if (ele.isNode()) {
      // control nodes are re-positioned during move; original node is updated after move
      controlNodes.push({
        data: {
          ...ele.data(),
          id: controlId,
        },
        group: "nodes",
        position: { ...ele.position() },
      });

      if (
        // for primary node (already has "theMoveVector")
        startEvent.target === ele ||
        // for broken/invisible line nodes
        ele.data("invisible") ||
        // for label nodes
        ele.data("label")
      ) {
        // do not add move vector
        return;
      }

      // move vector from "control" node to moving node
      controlEdges.push({
        group: "edges",
        data: { id: `moveVector${id}`, source: controlId, target: id },
        classes: [ELEMENT_CLASS_MOVE_VECTOR],
      });
    }

    if (ele.isEdge()) {
      controlEdges.push({
        group: "edges",
        data: {
          ...ele.data(),
          id: controlId,
          source: `moveStart${ele.source().id()}`,
          target: `moveStart${ele.target().id()}`,
        },
      });
    }
  });

  // clone adjacent edges, add "reposition" vector from edge start to moving node
  // actual adjacent edges are hidden
  adjacentEdges.forEach((ele) => {
    const id = ele.id();
    const source = ele.source();
    const target = ele.target();
    const isSourceMoving = movingElements.contains(source);
    const isTargetMoving = movingElements.contains(target);

    // clone original adjacent edge, repointing to "moveStart{id}" to remain stationary
    const sourceId = source.id();
    const targetId = target.id();
    controlEdges.push({
      group: "edges",
      data: {
        ...ele.data(),
        id: `adjacentEdgeStart${id}`,
        source: isSourceMoving ? `moveStart${sourceId}` : sourceId,
        target: isTargetMoving ? `moveStart${targetId}` : targetId,
      },
    });

    // vector from "control" node to moving node
    // move vector source is fixed, target is moving node
    controlEdges.push({
      group: "edges",
      data: {
        id: `moveVector${id}`,
        source:
          // broken line id ends with _S or _E, anchor to opposite coord
          id.endsWith("_S") || id.endsWith("_E")
            ? ele.data(BROKEN_LINE_COORD)
            : (isSourceMoving ? target : source).id(),
        target: (isTargetMoving ? target : source).id(),
      },
      classes: [ELEMENT_CLASS_MOVE_VECTOR],
    });
  });

  return controlNodes.concat(controlEdges);
}

/**
 * @param elements elements to index.
 * @returns Record<element id, cloned position>
 */
function getPositions(elements: CollectionReturnValue): Record<string, Position> {
  const positions: Record<string, Position> = {};
  elements.forEach((ele) => {
    const id = ele.id();
    if (ele.isEdge()) {
      positions[id] = {
        ...ele.midpoint(),
      };
    }
    if (ele.isNode()) {
      positions[id] = {
        // .position() returns a reference!
        ...ele.position(),
      };
    }
  });
  return positions;
}

/**
 * @param elements elements to update.
 * @param positions starting position of each element
 * @param dx: relative x
 * @param dy: relative y
 */
function setPositions(
  elements: CollectionReturnValue,
  positions: Record<string, Position>,
  dx: number,
  dy: number,
): void {
  elements.positions((ele) => {
    const position = positions[ele.id()];
    if (!position) {
      throw `missing position for element ${ele.id()}`;
    }
    return {
      x: position.x + dx,
      y: position.y + dy,
    };
  });
}

function updateMovedElements(
  movedElements: CollectionReturnValue,
  adjacentEdges: CollectionReturnValue,
  startPositions: Record<string, Position>,
): CollectionReturnValue {
  adjacentEdges.forEach((edge) => {
    const id = edge.id();
    const startPosition = startPositions[id];
    if (!startPosition) {
      return;
    }
    const labels = adjacentEdges.cy().$(`[featureId=${edge.data("lineId")}]`);
    const newMidpoint = edge.midpoint();
    const midpointDx = newMidpoint.x - startPosition.x;
    const midpointDy = newMidpoint.y - startPosition.y;

    labels.positions((label) => {
      // TODO (SJ-1804): more, better, faster
      const position = label.position();
      return {
        x: position.x + midpointDx,
        y: position.y + midpointDy,
      };
    });

    movedElements.merge(labels);
  });

  return movedElements;
}
