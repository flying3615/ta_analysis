import "./SelectedDiagram.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import {
  BoundingBox12,
  CollectionReturnValue,
  ElementDefinition,
  EventObjectEdge,
  EventObjectNode,
  InputEventObject,
  NodeSingular,
  Position,
} from "cytoscape";
import { useEffect } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";

import { getResizeLimits, isResizeControl, moveExtent, Resize, resizeExtent, ResizeLimits } from "./moveAndResizeUtil";

export interface SelectedDiagramProps {
  diagram: NodeSingular;
  diagrams: DiagramDTO[];
}

const DIAGRAM_CLASS_MOVABLE = "diagram-movable";
const DIAGRAM_CLASS_MOVING = "diagram-moving";
const DIAGRAM_CONTROL_CLASS = "diagram-control";
const DIAGRAM_CONTROL_SELECTOR = `.${DIAGRAM_CONTROL_CLASS}`;
const SELECTED_DIAGRAM = "selected-diagram";

/**
 * SelectedDiagram shows controls at diagram extents
 * and allows user to move or resize diagram.
 *
 * To update diagram after move/resize,
 * "data" are updated with with the new origin and zoomScale.
 *
 * To constrain diagram move/resize
 * - "diagramLimits" defines the page area where diagrams can move.
 * - "resizeLimits" are calculated when a resize begins based on diagram extent and limits.
 */
export function SelectedDiagram({ diagram, diagrams }: SelectedDiagramProps) {
  useEffect(() => {
    const cyto = diagram.cy();
    const container = cyto.container();
    if (!container) {
      return;
    }

    const cytoCoordMapper = new CytoscapeCoordinateMapper(container, diagrams);
    const diagramExtent = getDiagramDataAndExtent(cytoCoordMapper, diagram);
    const diagramLimits = cytoCoordMapper.getDiagramOuterLimitsPx();

    // move/resize state
    let moveId: string | undefined;
    let moveStart: Position | undefined;
    let resizeLimits: ResizeLimits | undefined;

    const allControls = cyto.add(getSelectedDiagramElement(diagramExtent)).addClass(SELECTED_DIAGRAM);
    // only resize controls move
    const resizeControls = cyto.add(getResizeControlElements());
    setResizeControlPositions(resizeControls, diagramExtent);
    // ungrabify to prevent default movement
    allControls.merge(resizeControls).addClass(DIAGRAM_CONTROL_CLASS).ungrabify();

    const addControlClass = (event: EventObjectNode | EventObjectEdge | InputEventObject) => {
      const id = moveId ?? event.target.id();
      const className = isResizeControl(id) ? id : moveId === id ? DIAGRAM_CLASS_MOVING : DIAGRAM_CLASS_MOVABLE;
      container.classList.add(className);
    };

    const beginMoveOrResize = (event: EventObjectNode | EventObjectEdge) => {
      moveId = event.target.id();
      moveStart = event.position;
      if (isResizeControl(moveId)) {
        resizeLimits = getResizeLimits(
          diagramExtent, // current diagram size
          moveId, // type of resize,
          [diagramLimits],
          {
            minHeight: cytoCoordMapper.scalePixelsPerCm * 5, // minimum 5 cm height
          },
        );
      }

      addControlClass(event);
      cyto.on("mousemove", updateMoveOrResize);
      cyto.on("mouseup", endMoveOrResize);
    };

    const endMoveOrResize = (event: InputEventObject) => {
      const newExtent = updateMoveOrResize(event);
      if (newExtent) {
        const updatedOriginAndScale = getNewDiagramOriginAndScale(cytoCoordMapper, diagram, newExtent);
        diagram.data(updatedOriginAndScale);
      }

      container.classList.remove(DIAGRAM_CLASS_MOVING);
      cyto.off("mousemove", updateMoveOrResize);
      cyto.off("mouseup", endMoveOrResize);
      moveId = undefined;
      moveStart = undefined;
      resizeLimits = undefined;
      removeControlClasses();
    };

    const removeControlClasses = (event?: EventObjectNode | EventObjectEdge) => {
      if (moveId) {
        return;
      }
      [...container.classList.values()].forEach((className) => {
        if (isResizeControl(className) || className === DIAGRAM_CLASS_MOVABLE) {
          if (
            className === DIAGRAM_CLASS_MOVABLE &&
            event?.target.data("diagramId") &&
            event?.target.data("planElementType") !== PlanElementType.DIAGRAM
          ) {
            return;
          }
          container.classList.remove(className);
        }
      });
    };

    /**
     * @param active diagram move/resize position event.
     * @returns BoundingBox12 representing new (page-constrained) diagram position.
     */
    const updateMoveOrResize = (event: InputEventObject): BoundingBox12 | undefined => {
      if (!moveId || !moveStart) {
        return;
      }

      const dx = event.position.x - moveStart.x;
      const dy = event.position.y - moveStart.y;
      let newExtent: BoundingBox12 | undefined;
      if (isResizeControl(moveId)) {
        newExtent = resizeExtent(diagramExtent, moveId, dx, dy, resizeLimits);
      } else {
        newExtent = moveExtent(diagramExtent, dx, dy, diagramLimits);
      }

      // update control position
      setResizeControlPositions(resizeControls, newExtent);

      return newExtent;
    };

    const selector = [`#${diagram.id()}`, DIAGRAM_CONTROL_SELECTOR].join(",");
    cyto.on("mousedown", selector, beginMoveOrResize);
    cyto.on("mouseout", selector, removeControlClasses);
    cyto.on("mouseover", selector, addControlClass);

    addControlClass({ target: diagram } as EventObjectNode);

    return () => {
      moveId = undefined; // in case move interrupted

      cyto.off("mousedown", selector, beginMoveOrResize);
      cyto.off("mousemove", updateMoveOrResize);
      cyto.off("mouseout", selector, removeControlClasses);
      cyto.off("mouseover", selector, addControlClass);
      cyto.off("mouseup", endMoveOrResize);
      cyto.remove(allControls);

      removeControlClasses();
    };
  }, [diagrams, diagram]);

  return <></>;
}

export interface DiagramData {
  diagramId: number;
  originPageX: number;
  originPageY: number;
  bottomRightX: number;
  bottomRightY: number;
  zoomScale: number;
}

function getDiagramDataAndExtent(
  cytoCoordMapper: CytoscapeCoordinateMapper,
  diagram: NodeSingular,
): DiagramData & BoundingBox12 {
  const data = diagram.data() as DiagramData;
  const { x: x1, y: y1 } = cytoCoordMapper.groundCoordToCytoscape(
    {
      x: data.originPageX,
      y: data.originPageY,
    },
    data.diagramId,
  );
  const { x: x2, y: y2 } = cytoCoordMapper.groundCoordToCytoscape(
    {
      x: data.bottomRightX,
      y: data.bottomRightY,
    },
    data.diagramId,
  );
  return { ...data, x1, x2, y1, y2 };
}

function getNewDiagramOriginAndScale(
  cytoCoordMapper: CytoscapeCoordinateMapper,
  diagram: NodeSingular,
  newExtent: BoundingBox12,
): Partial<DiagramData> {
  const data = getDiagramDataAndExtent(cytoCoordMapper, diagram);
  // new origin is relative to diagram coordinate system
  const newOrigin = cytoCoordMapper.cytoscapeToGroundCoord({ x: newExtent.x1, y: newExtent.y1 }, data.diagramId);
  const originDx = newOrigin.x / data.zoomScale;
  const originDy = newOrigin.y / data.zoomScale;
  // scale change same in either axis, since constrained
  const relativeScale = (data.x2 - data.x1) / (newExtent.x2 - newExtent.x1);
  return {
    originPageX: data.originPageX + originDx,
    originPageY: data.originPageY + originDy,
    zoomScale: data.zoomScale * relativeScale,
  };
}

function getResizeControlElements(): ElementDefinition[] {
  return [
    // corners
    { group: "nodes", data: { id: Resize.NW }, position: { x: 0, y: 0 } },
    { group: "nodes", data: { id: Resize.NE }, position: { x: 0, y: 0 } },
    { group: "nodes", data: { id: Resize.SE }, position: { x: 0, y: 0 } },
    { group: "nodes", data: { id: Resize.SW }, position: { x: 0, y: 0 } },
    // sides
    { group: "edges", data: { id: Resize.N, pointWidth: 2, source: Resize.NW, target: Resize.NE } },
    { group: "edges", data: { id: Resize.E, pointWidth: 2, source: Resize.NE, target: Resize.SE } },
    { group: "edges", data: { id: Resize.S, pointWidth: 2, source: Resize.SE, target: Resize.SW } },
    { group: "edges", data: { id: Resize.W, pointWidth: 2, source: Resize.SW, target: Resize.NW } },
  ];
}

function getResizeControlPosition(id: string, extent: BoundingBox12): Position {
  if (id === Resize.NW) {
    return { x: extent.x1, y: extent.y1 };
  } else if (id === Resize.NE) {
    return { x: extent.x2, y: extent.y1 };
  } else if (id === Resize.SE) {
    return { x: extent.x2, y: extent.y2 };
  } else if (id === Resize.SW) {
    return { x: extent.x1, y: extent.y2 };
  }
  return { x: 0, y: 0 };
}

function getSelectedDiagramElement(extent: BoundingBox12): ElementDefinition {
  return {
    group: "nodes",
    data: { id: SELECTED_DIAGRAM, width: extent.x2 - extent.x1, height: extent.y2 - extent.y1 },
    position: { x: (extent.x1 + extent.x2) / 2, y: (extent.y1 + extent.y2) / 2 },
  };
}

function setResizeControlPositions(controls: CollectionReturnValue, extent: BoundingBox12) {
  controls.nodes().positions((n) => getResizeControlPosition(n.id(), extent));
}
