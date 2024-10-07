import { CoordinateDTO, DiagramDTO, LabelDTO, LineDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import type { DisplayStateEnum } from "@linz/survey-plan-generation-api-client/src/models/DisplayStateEnum.ts";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import { DiagramData } from "@/components/PlanSheets/interactions/SelectedDiagram";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";

export const updateDiagramsWithNode = (diagrams: DiagramDTO[], node: INodeData): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    if (diagram.id !== node.properties["diagramId"]) {
      return diagram;
    }

    if (node.properties["elementType"] === "coordinates") {
      return {
        ...diagram,
        coordinates: diagram.coordinates.map((coordinate) =>
          coordinate.id === parseInt(node.id) ? mergeCoordinateData(coordinate, node) : coordinate,
        ),
      };
    } else if (node.properties["elementType"] === PlanElementType.DIAGRAM) {
      const data = node.properties as unknown as DiagramData;
      return {
        ...diagram,
        originPageOffset: {
          x: data.originPageX,
          y: data.originPageY,
        },
        zoomScale: data.zoomScale,
      };
    } else {
      const labelType = node.properties["elementType"] as "labels" | "coordinateLabels" | "lineLabels" | "parcelLabels";
      if (labelType === "parcelLabels") {
        return {
          ...diagram,
          parcelLabelGroups: diagram.parcelLabelGroups?.map((group) => {
            return {
              ...group,
              labels: group.labels.map((label) =>
                label.id === parseInt(node.id) ? mergeLabelData(label, node) : label,
              ),
            };
          }),
        };
      }

      return {
        ...diagram,
        [labelType]: diagram[labelType].map((label) =>
          label.id === parseInt(node.id) ? mergeLabelData(label, node) : label,
        ),
      };
    }
  });
};

export const updatePagesWithNode = (page: PageDTO, node: INodeData): PageDTO => {
  if (node.properties["elementType"] === "coordinates") {
    return {
      ...page,
      coordinates: page.coordinates?.map((coordinate) =>
        coordinate.id === parseInt(node.id) ? mergeCoordinateData(coordinate, node) : coordinate,
      ),
    };
  } else {
    return {
      ...page,
      labels: page.labels?.map((label) => (label.id === parseInt(node.id) ? mergeLabelData(label, node) : label)),
    };
  }
};

export const updateDiagramsWithEdge = (diagrams: DiagramDTO[], edge: IEdgeData): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    return {
      ...diagram,
      lines: diagram.lines.map((line) => (line.id === parseInt(edge.id) ? mergeLineData(line, edge) : line)),
    };
  });
};

const mergeLabelData = (label: LabelDTO, updatedNode: INodeData): LabelDTO => {
  function getUpdatedProperty<T>(property: string, defaultValue: T): T {
    const value = updatedNode.properties[property] as T;
    if (value === undefined) return defaultValue;
    return value;
  }

  const rotationAngle = getUpdatedProperty("textRotation", label.rotationAngle);
  const anchorAngle = getUpdatedProperty("anchorAngle", label.anchorAngle);
  const pointOffset = getUpdatedProperty("pointOffset", label.pointOffset);
  const textAlignment = getUpdatedProperty("textAlignment", label.textAlignment);
  const displayState = getUpdatedProperty("displayState", label.displayState) as DisplayStateEnum;

  return {
    ...label,
    displayText: updatedNode.label ?? label.displayText,
    position: updatedNode.position,
    rotationAngle: rotationAngle ? -rotationAngle : 0,
    anchorAngle,
    pointOffset,
    textAlignment,
    displayState,
  };
};

const mergeCoordinateData = (coordinate: CoordinateDTO, updatedNode: INodeData): CoordinateDTO => {
  return {
    ...coordinate,
    position: updatedNode.position,
    // TODO: Handle updating coordinate node data
  };
};

const mergeLineData = (line: LineDTO, _updatedEdge: IEdgeData): LineDTO => {
  return {
    ...line,
    // TODO: Handle updating line edge data
  };
};
