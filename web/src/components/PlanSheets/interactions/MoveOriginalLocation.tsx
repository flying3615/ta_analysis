import cytoscape, { BoundingBox12, EdgeSingular, NodeSingular, Position as CytoscapePosition } from "cytoscape";

import { IEdgeDataProperties, INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { moveExtent } from "@/components/PlanSheets/interactions/moveAndResizeUtil";
import { getRelatedElements, getRelatedLabels } from "@/components/PlanSheets/interactions/selectUtil";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useLineLabelAdjust } from "@/hooks/useLineLabelAdjust";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import {
  ElementLookupData,
  extractPositions,
  findElementsPosition,
  transformMovedLabelCoordinates,
} from "@/modules/plan/LookupOriginalCoord";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { getOriginalPositions } from "@/redux/planSheets/planSheetsSlice";

interface MoveOriginalLocationProps {
  target: NodeSingular | EdgeSingular | null;
}

export const MoveOriginalLocation = ({ target }: MoveOriginalLocationProps) => {
  const { cyto, cytoCoordMapper, updateActiveDiagramsAndPage, cytoDataToNodeAndEdgeData } = usePlanSheetsDispatch();
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
    if ("source" in target.data()) {
      const data = target.data() as IEdgeDataProperties;
      const srcId: string | undefined = data.source?.toString();
      const srcElement = coordinates.find((e) => e.id.toString() === srcId);

      if (moveStartPositions && srcId && srcElement) {
        const startPos = moveStartPositions[srcId] ?? { x: 0, y: 0 };
        const dx = -startPos.x + srcElement.position.x;
        const dy = -startPos.y + srcElement.position.y;
        return { x: dx, y: dy };
      }
    } else {
      const data = target.data() as INodeDataProperties;
      const element = coordinates.find((e) => e.id.toString() === data.id);
      return element ? element.position : { x: 0, y: 0 };
    }
    return { x: 0, y: 0 };
  }

  const restoreOriginalPosition = () => {
    const selected = cyto.elements(":selected");
    const related = getRelatedElements(target);
    const keepSelected = target.union(related || []);
    selected.difference(keepSelected).unselect();
    const connectedElements = selected.union(selected.connectedNodes());
    connectedElements.merge(getRelatedLabels(connectedElements));
    const adjacentEdges = connectedElements.connectedEdges().difference(connectedElements);
    const allElements = connectedElements.union(adjacentEdges).union(getRelatedLabels(adjacentEdges));

    moveStartPositions = extractPositions(allElements);

    const originalCoordinates: ElementLookupData[] = [];
    allElements.forEach((ele) => {
      const data = ele.data() as INodeDataProperties;
      const coordinates: ElementLookupData | null = findElementsPosition(data, allElements, originalPositions);

      if (coordinates && coordinates.position) {
        coordinates.position = cytoCoordMapper.groundCoordToCytoscape(coordinates.position, coordinates.diagramId);
        originalCoordinates.push(coordinates);
      }
    });
    const moveStart = cyto.$id(target.id()).position();
    const moveEnd = findMoveEnd(target, originalCoordinates);
    updateMove(moveStartPositions, connectedElements, selected.boundingBox(), moveStart, moveEnd);

    const movingElementsOffsetCoords = transformMovedLabelCoordinates(
      cytoCoordMapper,
      connectedElements,
      moveStartPositions,
    );
    const movingData = cytoDataToNodeAndEdgeData(movingElementsOffsetCoords);
    const movedNodes = movingData.nodes.filter((node) => node.properties.coordType === "node");
    const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));
    const adjustedLabels = adjustLabels(movedNodesById);

    updateActiveDiagramsAndPage({ nodes: [...movingData.nodes, ...adjustedLabels], edges: movingData.edges });
  };

  // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
  return <div onClick={restoreOriginalPosition}>Original location</div>;
};
