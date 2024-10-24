import { CoordinateDTO, DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";

interface DiagramElement {
  id: number;
  position?: cytoscape.Position;
}
export interface PositionLookup {
  [diagramId: string]: {
    [elementType: string]: {
      [id: string]: cytoscape.Position;
    };
  };
}
export interface TargetPositionLookup {
  id: string;
  elementType: string;
  diagramId: string;
}

export const LookupOriginalPosition = (diagrams: DiagramDTO[]): PositionLookup => {
  const positionLookup: PositionLookup = {};

  const addPositionsToLookup = (elements: DiagramElement[], type: string, diagramId: string) => {
    elements.forEach((element) => {
      if (element.position) {
        if (!positionLookup[diagramId]) {
          positionLookup[diagramId] = {};
        }
        if (!positionLookup[diagramId][type]) {
          positionLookup[diagramId][type] = {};
        }
        positionLookup[diagramId][type][element.id.toString()] = element.position;
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

export const restoreOriginalPosition = (lookup: PositionLookup, target: TargetPositionLookup) => {
  const { id, elementType, diagramId } = target;
  if (lookup[diagramId] && lookup[diagramId][elementType] && lookup[diagramId][elementType][id]) {
    return lookup[diagramId][elementType][id];
  } else {
    return null;
  }
};

const updateDiagramElements = (
  diagram: DiagramDTO,
  positions: cytoscape.Position[],
  elementType: keyof DiagramDTO,
  coordRefs: number[],
): DiagramDTO => {
  if (!diagram[elementType]) return diagram;

  const updatedElements = (diagram[elementType] as (CoordinateDTO | LabelDTO)[]).map((element) => {
    const index = coordRefs.indexOf(element.id);
    if (index !== -1) {
      return { ...element, position: { x: positions[index]?.x ?? 0, y: positions[index]?.y ?? 0 } };
    }
    return element;
  });

  return { ...diagram, [elementType]: updatedElements };
};

export const getUpdatedDiagrams = (
  activeDiagrams: DiagramDTO[],
  data: Record<string, string | number | boolean | undefined>,
  elementType: keyof DiagramDTO,
  positions: cytoscape.Position[],
  coordRefs: number[],
): DiagramDTO[] => {
  return activeDiagrams.map((diagram) => {
    if (diagram.id !== Number(data["diagramId"])) return diagram;
    return updateDiagramElements(diagram, positions, elementType, coordRefs);
  });
};
