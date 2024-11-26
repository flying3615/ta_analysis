import "./MoveSelectedHandler.scss";

import cytoscape, {
  BoundingBox12,
  CollectionReturnValue,
  EdgeDefinition,
  ElementDefinition,
  EventObjectEdge,
  EventObjectNode,
  InputEventObject,
  NodeDefinition,
  Position as CytoscapePosition,
} from "cytoscape";
import { useEffect } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  IEdgeDataProperties,
  IGraphDataProperties,
  INodeDataProperties,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { useLineLabelAdjust } from "@/hooks/useLineLabelAdjust";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { BROKEN_LINE_COORD } from "@/modules/plan/extractGraphData";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { Position } from "@/util/positionUtil";

import { moveExtent } from "./moveAndResizeUtil";
import { getRelatedLabels } from "./selectUtil";

export interface SelectedElementProps {
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
export function MoveSelectedHandler({ selectedElements }: SelectedElementProps) {
  const {
    cyto,
    cytoCanvas,
    cytoCoordMapper,
    updateActiveDiagramsAndPageFromCytoData,
    cytoDataToNodeAndEdgeData,
    updateActiveDiagramsAndPage,
  } = usePlanSheetsDispatch();
  const diagrams = useAppSelector(selectActiveDiagrams);
  const adjustLabelsWithLine = useLineLabelAdjust();
  const { adjustLabelNodes } = useAdjustLoadedPlanData();

  useEffect(() => {
    if (!cyto || !cytoCanvas || !cytoCoordMapper) {
      return;
    }

    // move selected, connected nodes, and related labels
    const movingElements = selectedElements.union(selectedElements.connectedNodes());
    movingElements.merge(getRelatedLabels(movingElements));
    const adjacentEdges = movingElements.connectedEdges().difference(movingElements);

    let moveControls: CollectionReturnValue | undefined;
    let moveElementsExtent: BoundingBox12 | undefined;
    let moveStart: CytoscapePosition | undefined;
    let moveStartPositions: Record<string, CytoscapePosition> | undefined;

    const addContainerClass = () => {
      cytoCanvas.classList.add(CONTAINER_CLASS_MOVABLE);
    };

    const beginMove = (event: EventObjectNode | EventObjectEdge) => {
      if (event.originalEvent.ctrlKey || event.originalEvent.shiftKey) {
        // only start move if ctrl/shift not pressed
        return;
      }
      moveControls = cyto.add(getMoveControlElements(movingElements, adjacentEdges));
      // set extent based on selection, not related
      moveElementsExtent = selectedElements.boundingBox();
      moveStart = event.position;

      moveStartPositions = getPositions(movingElements.union(adjacentEdges));

      adjacentEdges.addClass(ELEMENT_CLASS_MOVE_HIDE);
      cytoCanvas.classList.add(CONTAINER_CLASS_MOVING);
      cyto.boxSelectionEnabled(false);
      cyto.userPanningEnabled(false);
      cyto.on("mousemove", updateMove);
      cyto.on("mouseup", endMove);
    };

    const cleanupMove = () => {
      adjacentEdges.removeClass(ELEMENT_CLASS_MOVE_HIDE);
      cytoCanvas.classList.remove(CONTAINER_CLASS_MOVING);
      cyto.boxSelectionEnabled(true);
      cyto.userPanningEnabled(true);
      cyto.off("mousemove", updateMove);
      cyto.off("mouseup", endMove);
      if (moveControls) {
        cyto.remove(moveControls);
      }

      moveControls = undefined;
      moveElementsExtent = undefined;
      moveStart = undefined;
      moveStartPositions = undefined;
    };

    const endMove = (event: InputEventObject) => {
      if (updateMove(event)) {
        if (!moveStartPositions) {
          console.error("moveStartPositions is undefined at endMove");
          return;
        }

        const movingElementsOffsetCoords = convertMovedCoordinateLabelsToOffsets(
          cytoCoordMapper,
          movingElements,
          moveStartPositions,
        );

        const movingData = cytoDataToNodeAndEdgeData(movingElementsOffsetCoords);
        const movedNodes = movingData.nodes.filter((node) => node.properties.coordType === "node");
        const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));

        const adjustedLabels = adjustLabelsWithLine(movedNodesById);
        const changedNodes = [...movingData.nodes, ...adjustedLabels];

        const changedNodesInsideBounds = adjustLabelNodes(changedNodes, diagrams);

        updateActiveDiagramsAndPage({ nodes: changedNodesInsideBounds, edges: movingData.edges });
      }
      cleanupMove();
    };

    const removeContainerClass = () => {
      if (moveStart) {
        return;
      }
      cytoCanvas.classList.remove(CONTAINER_CLASS_MOVABLE);
    };

    /**
     * @param event diagram move/resize position event.
     * @returns CytoscapePosition representing (page-constrained) dx/dy move vector.
     */
    const updateMove = (event: InputEventObject): CytoscapePosition | undefined => {
      if (!moveElementsExtent || !moveStart || !moveStartPositions) {
        return;
      }
      const newExtent = moveExtent(moveElementsExtent, event.position.x - moveStart.x, event.position.y - moveStart.y);
      const dx = newExtent.x1 - moveElementsExtent.x1;
      const dy = newExtent.y1 - moveElementsExtent.y1;
      setPositions(movingElements, moveStartPositions, dx, dy);

      if (dx === 0 && dy === 0) {
        // no move
        return;
      }
      return { x: dx, y: dy };
    };

    addContainerClass();
    selectedElements.addClass(ELEMENT_CLASS_MOVE_CONTROL).grabify();

    cyto.on("mousedown", ELEMENT_SELECTOR_MOVE_CONTROL, beginMove);
    cyto.on("mouseout", ELEMENT_SELECTOR_MOVE_CONTROL, removeContainerClass);
    cyto.on("mouseover", ELEMENT_SELECTOR_MOVE_CONTROL, addContainerClass);

    return () => {
      cleanupMove();

      cyto.off("mousedown", ELEMENT_SELECTOR_MOVE_CONTROL, beginMove);
      cyto.off("mouseout", ELEMENT_SELECTOR_MOVE_CONTROL, removeContainerClass);
      cyto.off("mouseover", ELEMENT_SELECTOR_MOVE_CONTROL, addContainerClass);

      selectedElements.removeClass(ELEMENT_CLASS_MOVE_CONTROL).ungrabify();
      removeContainerClass();
    };
  }, [
    cyto,
    cytoCanvas,
    cytoCoordMapper,
    selectedElements,
    updateActiveDiagramsAndPageFromCytoData,
    adjustLabelsWithLine,
    cytoDataToNodeAndEdgeData,
    diagrams,
    updateActiveDiagramsAndPage,
    adjustLabelNodes,
  ]);

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

 * @param movingElements
 *   collection of elements being moved.
 *   @param adjacentEdges
 *    collection of edges adjacent to elements
 * @returns
 *   collection of move controls.
 */
function getMoveControlElements(
  movingElements: CollectionReturnValue,
  adjacentEdges: CollectionReturnValue,
): ElementDefinition[] {
  const controlEdges: EdgeDefinition[] = [];
  const controlNodes: NodeDefinition[] = [];

  // clone moving elements, adding move vectors to show change
  movingElements.forEach((ele) => {
    const id = ele.id();
    const controlId = `moveStart${id}`;

    if (ele.isNode()) {
      // label nodes move with
      if (ele.data("label")) {
        return;
      }

      // control nodes are re-positioned during move; original node is updated after move
      controlNodes.push({
        data: {
          ...(ele.data() as IGraphDataProperties),
          id: controlId,
        },
        group: "nodes",
        position: { ...ele.position() },
      });

      // do not add move vector for broken/invisible line nodes
      if (!ele.data("invisible")) {
        // move vector from "control" node to moving node
        controlEdges.push({
          group: "edges",
          data: { id: `moveVector${id}`, source: controlId, target: id },
          classes: [ELEMENT_CLASS_MOVE_VECTOR],
        });
      }
    }

    if (ele.isEdge()) {
      controlEdges.push({
        group: "edges",
        data: {
          ...(ele.data() as IEdgeDataProperties),
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
    const data = ele.data() as IEdgeDataProperties;
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
        ...(ele.data() as IEdgeDataProperties),
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
          (id.endsWith("_S") || id.endsWith("_E")) && data[BROKEN_LINE_COORD]
            ? data[BROKEN_LINE_COORD]
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
function getPositions(elements: CollectionReturnValue): Record<string, CytoscapePosition> {
  const positions: Record<string, CytoscapePosition> = {};
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
 * @param dx relative x
 * @param dy relative y
 */
function setPositions(
  elements: CollectionReturnValue,
  positions: Record<string, CytoscapePosition>,
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

const areAllElementsLabels = (elements: CollectionReturnValue): boolean =>
  elements.every((ele) => !!((ele as cytoscape.NodeSingular).isNode() && ele.data("label")));

function convertMovedCoordinateLabelsToOffsets(
  cytoCoordMapper: CytoscapeCoordinateMapper,
  movedElements: CollectionReturnValue,
  startPositions: Record<string, Position>,
): CollectionReturnValue {
  if (!areAllElementsLabels(movedElements)) {
    // It's a line or mark move
    // The labels stick to the marks and lines
    return movedElements;
  }

  movedElements.forEach((ele) => {
    if (!ele.isNode()) {
      return;
    }

    const movedEleStartPosition = startPositions[ele.id()];
    const data = ele.data() as INodeDataProperties;

    if (data.label && movedEleStartPosition && !data.symbolId) {
      const { pointOffset, anchorAngle } = cytoCoordMapper.labelPositionToOffsetAndAngle(ele, movedEleStartPosition, 1);
      ele.data({ pointOffset, anchorAngle, ignorePositionChange: true });
    }
  });

  return movedElements;
}
