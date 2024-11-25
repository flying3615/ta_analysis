import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import {
  CoordinateDTO,
  CoordinateDTOCoordTypeEnum,
  DisplayStateEnum,
  LineDTO,
  PageDTO,
} from "@linz/survey-plan-generation-api-client";
import cytoscape, { BoundingBox12, BoundingBoxWH } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { IEdgeData, INodeData, INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LineStyle } from "@/modules/plan/styling";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 10.0;
export const ZOOM_DELTA = 0.5;
export const SCROLL_THRESHOLD = 1.3;
export const PIXELS_PER_POINT = 0.75;
export const POINTS_PER_CM = 28.3465;
export interface IDiagramAreasLimits {
  diagramOuterLimitsPx: BoundingBox12;
  disabledAreasLimitsPx: BoundingBox12[];
  availableAreaLimitWithPageBlockPx: BoundingBox12;
}

let _panX: number;
let _panY: number;
let _prevZoomX: number;
let _prevZoomY: number;

const zoomToFit = (cy?: cytoscape.Core) => {
  cy?.reset();
};

const zoomByDelta = (delta: number, cy?: cytoscape.Core) => {
  if (!cy) return;

  const container = cy.container();
  if (!container) return;

  const currentZoom = cy.zoom();
  const deltaDec = (1 - MIN_ZOOM) / 2; // legacy steps
  const deltaInc = (MAX_ZOOM - 1) / 4; // legacy steps
  const newZoom =
    delta > 0
      ? currentZoom < 1
        ? currentZoom + deltaDec
        : currentZoom + deltaInc
      : currentZoom <= 1
        ? currentZoom - deltaDec
        : currentZoom - deltaInc;

  if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) return;

  const centerX = container.clientWidth / 2;
  const centerY = container.clientHeight / 2;
  if ((cy.zoom() <= 1 && delta < 0) || (cy.zoom() < 1 && delta > 0)) {
    cy.pan({ x: 0, y: 0 });
    cy.zoom(newZoom);
  } else {
    cy.zoom({
      level: newZoom,
      renderedPosition: { x: centerX, y: centerY },
    });
  }
};

const zoomToSelectedRegion = (x1: number, y1: number, x2: number, y2: number, cy?: cytoscape.Core) => {
  if (cy) {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const centerX = (x2 + x1) / 2;
    const centerY = (y2 + y1) / 2;
    const zoomLevel = Math.min(cy.width() / width, cy.height() / height);
    cy.panningEnabled(true);
    cy.zoom({
      level: zoomLevel,
      renderedPosition: { x: centerX, y: centerY },
    });
  }
};

const scrollToZoom = (cy: cytoscape.Core) => {
  if (cy.zoom() < SCROLL_THRESHOLD) {
    cy.pan({ x: 0, y: 0 });
  }
};

const keepPanWithinBoundaries = (cy: cytoscape.Core) => {
  if (cy.zoom() <= 1) {
    cy.pan({ x: 0, y: 0 });
    return;
  }

  const { x1, x2, y1, y2 } = cy.extent();
  const container = cy.container();
  const disableUserPanning = () => cy.userPanningEnabled(false);

  if (!container) return;

  const { clientWidth, clientHeight } = container;
  const pan = cy.pan();

  let newX = pan.x;
  let newY = pan.y;

  if (x1 < 0) {
    newX = 0;
  }
  if (y1 < 0) {
    newY = 0;
  }
  if (x2 > clientWidth) {
    if (_panX === undefined || _prevZoomX !== cy.zoom()) {
      _panX = pan.x;
    }
    newX = _panX;
    _prevZoomX = cy.zoom();
  }
  if (y2 > clientHeight) {
    if (_panY === undefined || _prevZoomY !== cy.zoom()) {
      _panY = pan.y;
    }
    newY = _panY;
    _prevZoomY = cy.zoom();
  }

  if (newX !== pan.x || newY !== pan.y) {
    disableUserPanning();
    cy.pan({ x: newX, y: newY });
  }
};

const onViewportChange = (cy: cytoscape.Core) => {
  if (!cy.userPanningEnabled()) {
    cy.userPanningEnabled(true);
  }
};

const constrain = (val: number, min: number, max: number): number => {
  return val < min ? min : val > max ? max : val;
};

const constrainInBox = (node: cytoscape.NodeSingular, bb: cytoscape.BoundingBox12): cytoscape.Position => {
  const pos = node.position();
  const w = node.width();
  const h = node.height();

  return {
    x: constrain(pos.x, bb.x1 + w / 2, bb.x2 - w / 2),
    y: constrain(pos.y, bb.y1 + h / 2, bb.y2 - h / 2),
  };
};

/**
 * Returns a function that constrains a node's position within a bounding box.
 * @param bb - The bounding box.
 * @returns A function that takes a node and returns its constrained position.
 */
export const boxPosition = (bb: cytoscape.BoundingBox12) => {
  return (node: cytoscape.NodeSingular): cytoscape.Position => {
    return constrainInBox(node, bb);
  };
};

export const keepNodeWithinAreaLimit = (evt: cytoscape.EventObject): void => {
  const cy = evt.cy;
  const node = evt.target as cytoscape.NodeSingular;
  const data = node.data() as INodeDataProperties;
  const nodeBB: BoundingBoxWH = node.boundingBox({ includeLabels: false, includeOverlays: false });
  const [border1, border2] = ["border_1001", "border_1007"].map((id) => cy.getElementById(id).position());

  if (!border1 || !border2) return;

  const boundingBox: cytoscape.BoundingBox12 =
    (data.elementType === PlanElementType.COORDINATE_LABELS && data.labelType === LabelDTOLabelTypeEnum.markName) ||
    data.elementType === PlanElementType.PARCEL_LABELS
      ? { x1: border1.x + nodeBB.w / 2, y1: border1.y, x2: border2.x - nodeBB.w / 2, y2: border2.y }
      : data.elementType === PlanElementType.LABELS && data.labelType === LabelDTOLabelTypeEnum.userAnnotation
        ? {
            x1: border1.x + nodeBB.w,
            y1: border1.y + nodeBB.h / 2,
            x2: border2.x - nodeBB.w,
            y2: border2.y - nodeBB.h / 2,
          }
        : { x1: border1.x, y1: border1.y, x2: border2.x, y2: border2.y };

  const { x, y } = boxPosition(boundingBox)(node);
  const { x: currentX, y: currentY } = node.position();

  if (x !== currentX || y !== currentY) {
    node.position({ x, y });
  }
};

/**
 * Get areas limits for the diagram
 * @param cytoscapeCoordMapper
 * @param cy
 * @returns outer limits of page frame and disabled areas limits (reserved for text blocks and page number block)
 */
const getDiagramAreasLimits = (
  cytoscapeCoordMapper: CytoscapeCoordinateMapper,
  cy?: cytoscape.Core,
): IDiagramAreasLimits | undefined => {
  if (!cy) return;

  // Get outer limits of page frame
  const diagramOuterLimitsPx = cytoscapeCoordMapper.getDiagramOuterLimitsPx();
  // Get limits of disabled areas (text blocks and page number block)
  const node1 = cy.getElementById("border_page_no1").position();
  const node2 = cy.getElementById("border_page_no2").position();

  if (!node1 || !node2) return;

  const disabledAreasLimitsPx: BoundingBox12[] = [
    { x1: node1.x, x2: diagramOuterLimitsPx.x2, y1: node1.y, y2: node2.y },
    {
      x1: diagramOuterLimitsPx.x1,
      x2: diagramOuterLimitsPx.x2,
      y1: node2.y,
      y2: diagramOuterLimitsPx.y2,
    },
  ];

  const availableAreaLimitWithPageBlockPx = {
    x1: diagramOuterLimitsPx.x1,
    x2: diagramOuterLimitsPx.x2,
    y1: diagramOuterLimitsPx.y1,
    y2: node1.y,
  };

  return { diagramOuterLimitsPx, disabledAreasLimitsPx, availableAreaLimitWithPageBlockPx };
};

const isPositionWithinAreaLimits = (position: cytoscape.Position, areas: BoundingBox12[]): boolean => {
  return areas.some((area) => {
    return position.x >= area.x1 && position.x <= area.x2 && position.y >= area.y1 && position.y <= area.y2;
  });
};

export const filterNodeData = (nodeData: INodeData[], displayStateValue: string) => {
  return nodeData.filter((node) => {
    const { properties } = node;
    const { elementType, displayState } = properties || {};
    const validElementTypes = ["coordinateLabels", "lineLabels", "lines", "parcelLabels", "labels"];
    return !(validElementTypes.includes(elementType!) && displayState === displayStateValue);
  });
};

export const filterEdgeData = (edgeData: IEdgeData[], displayStateValue: string) => {
  return edgeData.filter((edge) => {
    const { properties } = edge;
    const { elementType, displayState } = properties || {};
    const validElementTypes = ["coordinateLabels", "lineLabels", "lines", "parcelLabels", "labels"];
    return !(validElementTypes.includes(elementType!) && displayState === displayStateValue);
  });
};

export const filterHiddenNodes = (nodes: INodeData[]) =>
  nodes.filter(
    (node) =>
      ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
        node.properties.displayState?.valueOf() ?? "",
      ),
  );

export const filterHiddenEdges = (edges: IEdgeData[]) =>
  edges.filter(
    (edge) =>
      ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
        edge.properties.displayState?.valueOf() ?? "",
      ),
  );

/**
 * Count the number of lines from a collection of edges
 * @param edges
 */
const countLines = (edges: cytoscape.EdgeCollection | undefined): number => {
  if (!edges || edges.length === 0) {
    return 0;
  }

  // Create a map of source to target nodes
  const edgeMap = new Map<string, string>();
  edges.forEach((edge) => {
    edgeMap.set(edge.source().id(), edge.target().id());
  });

  // Find all starting edges (edges whose source is not a target of any other edge)
  const startEdges = edges.filter((edge) => !Array.from(edgeMap.values()).includes(edge.source().id()));

  // If no start edges found, it means all edges are part of a single multi-section line
  if (startEdges.length === 0) {
    return 1;
  } else {
    return startEdges.length;
  }
};

export const addPageLineByCoordList = (
  page: PageDTO,
  nodeList: cytoscape.NodeDefinition[],
  cytoCoordMapper: CytoscapeCoordinateMapper,
  edgeId: number,
  defaultLine?: LineDTO,
): PageDTO => {
  const coordList: CoordinateDTO[] = [];
  nodeList.forEach((node) => {
    if (node.data.id && node.position) {
      coordList.push({
        id: parseInt(node.data.id),
        coordType: CoordinateDTOCoordTypeEnum.userDefined,
        position: cytoCoordMapper.cytoscapeToPlanCoord(node.position),
      });
    }
  });

  const line: LineDTO = {
    id: edgeId,
    lineType: "userDefined",
    style: defaultLine?.style ?? LineStyle.SOLID,
    pointWidth: defaultLine?.pointWidth ?? 1,
    coordRefs: nodeList.map((node) => (node.data.id ? parseInt(node.data.id) : 0)),
    displayState: defaultLine?.displayState ?? DisplayStateEnum.display,
  };

  return {
    ...page,
    coordinates: [...(page.coordinates ?? []), ...coordList],
    lines: [...(page.lines ?? []), line],
  };
};

export const cytoscapeUtils = {
  zoomToFit,
  zoomByDelta,
  zoomToSelectedRegion,
  scrollToZoom,
  keepPanWithinBoundaries,
  onViewportChange,
  getDiagramAreasLimits,
  isPositionWithinAreaLimits,
  countLines,
  addPageLineByList: addPageLineByCoordList,
};
