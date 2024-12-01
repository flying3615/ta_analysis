import { radiansToDegrees } from "@turf/helpers";
import cytoscape, { BoundingBox12, EdgeSingular, NodeSingular, Position as CytoscapePosition } from "cytoscape";

import {
  IEdgeDataProperties,
  INodeAndEdgeData,
  INodeData,
  INodeDataProperties,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { moveExtent } from "@/components/PlanSheets/interactions/moveAndResizeUtil";
import { getRelatedLabels } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useLineLabelAdjust } from "@/hooks/useLineLabelAdjust";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { ElementLookupData, extractPositions, findElementsPosition } from "@/modules/plan/LookupOriginalCoord";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { updateDiagramsWithNode } from "@/modules/plan/updatePlanData";
import { getOriginalPositions, replaceDiagramsAndPage } from "@/redux/planSheets/planSheetsSlice";
import { clampAngleDegrees360, midPoint } from "@/util/positionUtil";

interface MoveOriginalLocationProps {
  target: NodeSingular | EdgeSingular | null;
}

export const MoveOriginalLocation = ({ target }: MoveOriginalLocationProps) => {
  const { cyto, cytoCoordMapper, cytoDataToNodeAndEdgeData } = usePlanSheetsDispatch();
  const dispatch = useAppDispatch();
  const originalPositions = useAppSelector(getOriginalPositions);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const adjustLabels = useLineLabelAdjust();
  let moveStartPositions: Record<string, cytoscape.Position> | undefined;

  if (!cyto || !target || !activeDiagrams || !originalPositions || !cytoCoordMapper) return;

  const updateMove = (
    moveStartPositions: Record<string, CytoscapePosition> | undefined,
    movingElements: cytoscape.CollectionReturnValue,
    moveElementsExtent: BoundingBox12 | undefined,
    moveStart: CytoscapePosition | undefined,
    moveEnd: CytoscapePosition | undefined,
  ): CytoscapePosition | undefined => {
    if (!moveElementsExtent || !moveStart || !moveEnd || !moveStartPositions) {
      return;
    }

    const newExtent = moveExtent(moveElementsExtent, moveEnd.x - moveStart.x, moveEnd.y - moveStart.y);
    const dx = newExtent.x1 - moveElementsExtent.x1;
    const dy = newExtent.y1 - moveElementsExtent.y1;
    movingElements.positions((ele) => {
      const position = moveStartPositions[ele.id()];
      if (!position) {
        throw `missing position for element ${ele.id()}`;
      }
      return {
        x: position.x + dx,
        y: position.y + dy,
      };
    });

    if (dx === 0 && dy === 0) {
      return;
    }
    return { x: dx, y: dy };
  };

  function findMoveEnd(
    target: NodeSingular | EdgeSingular,
    coordinates: ElementLookupData[],
  ): { x: number; y: number } {
    const data = target.data() as IEdgeDataProperties;

    if ("source" in data) {
      const srcId = data.source?.toString();
      const srcElement = coordinates.find((e) => e.id.toString() === srcId);
      if (srcElement) {
        return srcElement.position;
      }
    }

    if ("target" in data) {
      const targetId = data.target?.toString();
      const targetElement = coordinates.find((e) => e.id.toString() === targetId);
      if (targetElement) {
        return targetElement.position;
      }
    }

    const element = coordinates.find((e) => e.id.toString() === data.id);
    return element ? element.position : { x: 0, y: 0 };
  }

  const getMovedDataLabels = (
    selectedNodes: cytoscape.CollectionReturnValue,
  ): [INodeAndEdgeData, INodeData[]] | null => {
    const connectedElements = selectedNodes.union(selectedNodes.connectedNodes());
    connectedElements.merge(getRelatedLabels(connectedElements));
    const adjacentEdges = connectedElements.connectedEdges().difference(connectedElements);
    const allElements = connectedElements.union(adjacentEdges).union(getRelatedLabels(adjacentEdges));

    moveStartPositions = extractPositions(allElements);

    const originalCoordinates: ElementLookupData[] = [];
    allElements.forEach((ele) => {
      const data = ele.data() as INodeDataProperties;
      const coordinates = findElementsPosition(data, allElements, originalPositions);

      if (coordinates?.position) {
        coordinates.position = cytoCoordMapper.groundCoordToCytoscape(coordinates.position, coordinates.diagramId);
        originalCoordinates.push(coordinates);
      }
    });
    const moveStart = selectedNodes.position();
    const moveEnd = findMoveEnd(target, originalCoordinates);
    if (moveEnd.x === 0 && moveEnd.y === 0) return null;

    updateMove(moveStartPositions, connectedElements, selectedNodes.boundingBox(), moveStart, moveEnd);

    const movingData = cytoDataToNodeAndEdgeData(connectedElements);
    const movedNodes = movingData.nodes.filter((node) => node.properties.coordType === "node");
    const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));
    const adjustedLabels = adjustLabels(movedNodesById);

    if (cyto.elements(":selected").isEdge()) {
      const selectedLine = cyto.elements(":selected");
      const lineMidPoint = midPoint(selectedLine.target().position(), selectedLine.source().position());
      const labelIds = getRelatedLabels(selectedLine.union(selectedLine.connectedNodes()))
        .filter((ele) => (ele.data() as INodeDataProperties).elementType === PlanElementType.LINE_LABELS)
        .map((ele) => ele.id());

      adjustedLabels?.forEach((node) => {
        if (node.properties.diagramId && labelIds.includes(node.id)) {
          node.position = cytoCoordMapper.cytoscapeToGroundCoord(lineMidPoint, node.properties.diagramId);
          // Update properties
          const { x: startX, y: startY } = selectedLine.source().position();
          const { x: endX, y: endY } = selectedLine.target().position();

          let lineAngle = radiansToDegrees(-Math.atan2(endY - startY, endX - startX));
          lineAngle = lineAngle > 90 ? lineAngle - 180 : lineAngle < -90 ? lineAngle + 180 : lineAngle;
          node.properties.textRotation = clampAngleDegrees360(lineAngle);
        }
      });
    }

    return [movingData, adjustedLabels];
  };

  const updateActiveDiagrams = (elements: Partial<INodeAndEdgeData>) => {
    let updatedDiagrams = activeDiagrams;
    elements.nodes?.forEach((node) => {
      if (node.properties.diagramId) {
        updatedDiagrams = updateDiagramsWithNode(updatedDiagrams, node);
      }
    });

    return updatedDiagrams;
  };

  const restoreOriginalPosition = () => {
    const data = target.data() as INodeDataProperties;
    if ("source" in data && "target" in data) {
      const srcData = getMovedDataLabels(cyto.$id(data["source"] as string));
      const targetData = getMovedDataLabels(cyto.$id(data["target"] as string));

      if (srcData && targetData) {
        const updatedDiagrams = updateActiveDiagrams({
          nodes: [...srcData[0].nodes, ...targetData[0].nodes, ...srcData[1], ...targetData[1]],
        });
        dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams }));
      }
    } else {
      const srcData = getMovedDataLabels(cyto.elements(":selected"));
      if (srcData) {
        const updatedDiagrams = updateActiveDiagrams({
          nodes: [...srcData[0].nodes, ...srcData[1]],
          edges: [...srcData[0].edges],
        });
        dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams }));
      }
    }
  };

  // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
  return <div onClick={restoreOriginalPosition}>Original location</div>;
};
