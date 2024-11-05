import { CoordinateDTO, DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import { EdgeSingular, NodeSingular } from "cytoscape";

import { INodeData, INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { getRelatedElements, getRelatedLabels } from "@/components/PlanSheets/interactions/selectUtil";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useLineLabelAdjust } from "@/hooks/useLineLabelAdjust";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { ElementLookupData, findElementsPosition } from "@/modules/plan/LookupOriginalCoord";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { getOriginalPositions, replaceDiagrams } from "@/redux/planSheets/planSheetsSlice";

interface MoveOriginalLocationProps {
  target: NodeSingular | EdgeSingular | null;
}

export const MoveOriginalLocation = ({ target }: MoveOriginalLocationProps) => {
  const { cyto, cytoDataToNodeAndEdgeData } = usePlanSheetsDispatch();
  const originalPositions = useAppSelector(getOriginalPositions);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const dispatch = useAppDispatch();
  const adjustLabels = useLineLabelAdjust();

  if (!cyto || !target || !activeDiagrams || !originalPositions) return;

  function getUpdatedDiagrams(
    elements: ElementLookupData[],
    labels: INodeData[],
    diagrams: DiagramDTO[],
  ): DiagramDTO[] {
    return diagrams.map((diagram) => {
      const updatePositions = (items: (CoordinateDTO | LabelDTO)[], idPrefix = "") =>
        items.map((item) => {
          const matchingElem = elements.find(
            (e) => e.diagramId === diagram.id && e.id.toString() === `${idPrefix}${item.id}`.toString(),
          );
          return matchingElem
            ? { ...item, position: matchingElem.position, ...(idPrefix && { pointOffset: 1 }) }
            : item;
        });
      const updatedCoordinateLabels = updatePositions(diagram.coordinateLabels, "LAB_");
      const updatedCoordinates = updatePositions(diagram.coordinates);
      const updatedLineLabels = diagram.lineLabels.map((label) => {
        const matchingElem = labels.find(
          (e) => e.properties.diagramId === diagram.id && e.id.toString() === `LAB_${label.id}`.toString(),
        );
        return matchingElem
          ? {
              ...label,
              position: matchingElem.position,
              rotationAngle: matchingElem.properties?.textRotation,
              anchorAngle: matchingElem.properties?.anchorAngle,
            }
          : label;
      });

      return {
        ...diagram,
        coordinates: updatedCoordinates,
        coordinateLabels: updatedCoordinateLabels,
        lineLabels: updatedLineLabels,
      };
    }) as DiagramDTO[];
  }

  const updateMovedNodePosition = (coords: ElementLookupData[], movedNode: { [p: string]: INodeData }) => {
    const updatedMovedNode = { ...movedNode };
    coords.forEach((elem) => {
      const matchingElem = updatedMovedNode[elem.id];
      if (matchingElem) {
        updatedMovedNode[elem.id] = {
          ...matchingElem,
          position: elem.position,
        };
      }
    });
    return updatedMovedNode;
  };

  const restoreOriginalPosition = () => {
    const selected = cyto.elements(":selected");
    const related = getRelatedElements(target);
    const keepSelected = target.union(related || []);
    selected.difference(keepSelected).unselect();
    const connectedElements = selected.union(selected.connectedNodes());
    connectedElements.merge(getRelatedLabels(connectedElements));
    const adjacentEdges = connectedElements.connectedEdges().difference(connectedElements);

    const allElements = connectedElements.union(adjacentEdges).union(getRelatedLabels(adjacentEdges));
    // const moveStartPositions = extractPositions(allElements);
    const movingData = cytoDataToNodeAndEdgeData(allElements);
    const movedNodes = movingData.nodes.filter((node) => node.properties.coordType === "node");
    const movedNodesById = Object.fromEntries(movedNodes.map((node) => [node.id, node]));

    const allCoordinates: ElementLookupData[] = [];
    allElements.forEach((ele) => {
      const data = ele.data() as INodeDataProperties;
      const coordinates: ElementLookupData | null = findElementsPosition(data, allElements, originalPositions);
      if (coordinates) {
        allCoordinates.push(coordinates);
      }
    });
    const updateMovedNodes = updateMovedNodePosition(allCoordinates, movedNodesById);
    const adjustedLabels = adjustLabels(updateMovedNodes);
    const updatedDiagrams = getUpdatedDiagrams(allCoordinates, adjustedLabels, activeDiagrams);
    dispatch(replaceDiagrams(updatedDiagrams));
  };

  // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
  return <div onClick={restoreOriginalPosition}>Original location</div>;
};
