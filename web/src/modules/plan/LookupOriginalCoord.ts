import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue } from "cytoscape";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";

interface DiagramElement {
  id: number;
  position?: cytoscape.Position;
  originalCoord?: cytoscape.Position;
}
export interface CoordLookup {
  [diagramId: string]: {
    [elementType: string]: {
      [id: string]: cytoscape.Position;
    };
  };
}
export type ElementLookupData = { diagramId: number; position: cytoscape.Position; elementType: string; id: number };

export const LookupOriginalCoord = (diagrams: DiagramDTO[]): CoordLookup => {
  const positionLookup: CoordLookup = {};

  const addPositionsToLookup = (elements: DiagramElement[], type: string, diagramId: string) => {
    elements.forEach((element) => {
      if (element.originalCoord) {
        if (!positionLookup[diagramId]) {
          positionLookup[diagramId] = {};
        }
        if (!positionLookup[diagramId][type]) {
          positionLookup[diagramId][type] = {};
        }
        positionLookup[diagramId][type][element.id.toString()] = element.originalCoord;
      }
    });
  };

  diagrams.forEach((diagram) => {
    const diagramId = diagram.id.toString();
    addPositionsToLookup(diagram.coordinateLabels, "coordinateLabels", diagramId);
    addPositionsToLookup(diagram.coordinates, "coordinates", diagramId);
    addPositionsToLookup(diagram.labels, "labels", diagramId);
    addPositionsToLookup(diagram.lineLabels, "lineLabels", diagramId);
    addPositionsToLookup(diagram.lines, "lines", diagramId);
    if (diagram.parcelLabelGroups) {
      diagram.parcelLabelGroups.forEach((group) => {
        addPositionsToLookup(group.labels || [], "parcelLabelGroups", diagramId);
      });
    }
  });

  return positionLookup;
};

export function findElementsPosition(
  data: INodeDataProperties,
  allElements: cytoscape.CollectionReturnValue,
  originalPositions: CoordLookup,
): ElementLookupData | null {
  const { diagramId, elementType, id, featureId, target } = data;

  const diagramData = originalPositions[diagramId as number];
  const coordinates = diagramData?.["coordinates"];

  if (!coordinates) return null;

  let positionId: number | undefined;

  if (elementType === PlanElementType.COORDINATES) {
    positionId = Number(id);
  } else if (elementType === PlanElementType.COORDINATE_LABELS) {
    positionId = Number(featureId);
  } else if (elementType === PlanElementType.LINES) {
    positionId = Number(target);
  } else if (elementType === PlanElementType.LINE_LABELS) {
    const sourceNode = allElements
      .filter((ele) => {
        const data = ele.data() as INodeDataProperties;
        return Number(data["lineId"]) === Number(featureId) && data["elementType"] === PlanElementType.LINES;
      })
      .data() as INodeDataProperties;
    positionId = sourceNode ? Number(sourceNode["source"]) : undefined;
  }

  if (positionId !== undefined && coordinates[positionId]) {
    return {
      diagramId,
      position: coordinates[positionId],
      elementType,
      id: elementType === PlanElementType.LINES ? positionId : id,
    } as ElementLookupData;
  }

  return null;
}

export function extractPositions(elements: CollectionReturnValue): Record<string, cytoscape.Position> {
  const posMap: Record<string, cytoscape.Position> = {};
  elements.forEach((element) => {
    const elementId = element.id();
    if (element.isEdge()) {
      posMap[elementId] = {
        ...element.midpoint(),
      };
    }
    if (element.isNode()) {
      posMap[elementId] = {
        ...element.position(),
      };
    }
  });
  return posMap;
}
