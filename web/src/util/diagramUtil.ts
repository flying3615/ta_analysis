import { DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";

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
