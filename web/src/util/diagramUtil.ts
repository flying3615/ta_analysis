import { CartesianCoordsDTO, DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import { sum } from "lodash-es";

export type DiagramLabelField = "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels" | "childDiagrams";

export const mapDiagramLabels = (
  diagram: DiagramDTO,
  labelField: DiagramLabelField | DiagramLabelField[],
  mapper: (label: LabelDTO) => LabelDTO,
): DiagramDTO => {
  return [labelField].flat().reduce((diagramAcc, field) => mapDiagramLabelField(diagramAcc, field, mapper), diagram);
};

const mapDiagramLabelField = (
  diagram: DiagramDTO,
  labelField: DiagramLabelField,
  mapper: (label: LabelDTO) => LabelDTO,
): DiagramDTO => {
  if (labelField === "parcelLabels") {
    return {
      ...diagram,
      parcelLabelGroups: diagram.parcelLabelGroups?.map((group) => ({ ...group, labels: group.labels.map(mapper) })),
    };
  }

  if (labelField === "childDiagrams") {
    return {
      ...diagram,
      childDiagrams: diagram.childDiagrams?.map((childDiagram) => ({
        ...childDiagram,
        labels: childDiagram.labels.map(mapper),
      })),
    };
  }

  return { ...diagram, [labelField]: diagram[labelField]?.map(mapper) };
};

export const mapAllDiagramLabels = (diagram: DiagramDTO, mapper: (label: LabelDTO) => LabelDTO): DiagramDTO => {
  let updatedDiagram = diagram;
  for (const labelField of [
    "labels",
    "parcelLabels",
    "coordinateLabels",
    "lineLabels",
    "childDiagrams",
  ] as DiagramLabelField[]) {
    updatedDiagram = mapDiagramLabels(updatedDiagram, labelField, mapper);
  }

  return updatedDiagram;
};

export const findLabelById = (
  diagram: DiagramDTO,
  labelField: DiagramLabelField,
  cytoscapeNodeId: string,
): LabelDTO | undefined => {
  if (labelField === "parcelLabels") {
    return diagram?.parcelLabelGroups
      ?.flatMap((plg) => plg.labels)
      ?.find((parcelLabel) => `LAB_${parcelLabel.id}` === cytoscapeNodeId);
  }

  if (labelField === "childDiagrams") {
    return diagram?.childDiagrams
      ?.flatMap((childDiagram) => childDiagram.labels)
      ?.find((childDiagramLabel) => `LAB_${childDiagramLabel.id}` === cytoscapeNodeId);
  }

  return diagram[labelField]?.find((label) => `LAB_${label.id}` === cytoscapeNodeId);
};

export const lineMidpoint = (
  surveyCentreLatitude: number,
  diagram: DiagramDTO,
  coordRefs: number[],
): CartesianCoordsDTO => {
  const latLongDistanceRatio = Math.cos((surveyCentreLatitude * Math.PI) / 180.0);

  const coordinates = coordRefs.map((coordRef) => diagram.coordinates.find((coord) => coord.id === coordRef)?.position);
  if (coordinates.some((coord) => !coord)) {
    throw new Error(`Could not find all coordinates`);
  }
  const lineCoordinates = coordinates as CartesianCoordsDTO[];

  const segmentLengths = lineCoordinates.slice(1).map((coord, index: keyof typeof lineCoordinates) => {
    const previousCoordinate = lineCoordinates[index] as CartesianCoordsDTO;
    return Math.sqrt(
      ((coord.x - previousCoordinate.x) / latLongDistanceRatio) ** 2 + (coord.y - previousCoordinate.y) ** 2,
    );
  });

  const totalLength = sum(segmentLengths);
  const halfLength = totalLength / 2;
  let currentTotalLength = 0;
  for (let n = 0; n < segmentLengths.length; n++) {
    const thisSegLength = segmentLengths[n] as number;
    const prevTotalLength = currentTotalLength;
    currentTotalLength += thisSegLength;
    if (currentTotalLength >= halfLength) {
      if (thisSegLength === 0) {
        return lineCoordinates[n] as CartesianCoordsDTO;
      }

      const previousCoordinate = lineCoordinates[n] as CartesianCoordsDTO;
      const nextCoordinate = lineCoordinates[n + 1] as CartesianCoordsDTO;
      const remainingLength = halfLength - prevTotalLength;
      const dx = nextCoordinate.x - previousCoordinate.x;
      const dy = nextCoordinate.y - previousCoordinate.y;
      const ratio = remainingLength / thisSegLength;
      return {
        x: previousCoordinate.x + dx * ratio,
        y: previousCoordinate.y + dy * ratio,
      };
    }
  }

  throw new Error("Failed to calculate midpoint");
};
