import {
  CoordinateDTO,
  DiagramDTO,
  DisplayStateEnum,
  LabelDTO,
  LabelDTOLabelTypeEnum,
  LineDTO,
  PageDTO,
} from "@linz/survey-plan-generation-api-client";

import { IDiagramNodeData, IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LabelPropsToUpdate, LabelPropsToUpdateWithElemType } from "@/components/PlanSheets/properties/LabelProperties";
import { cytoscapeLabelIdToPlanData } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { LinePropsToUpdate } from "@/components/PlanSheets/properties/LineProperties";
import { mapDiagramLabels } from "@/util/diagramUtil";
import { Position } from "@/util/positionUtil";

// Extend the PageLabel so we can keep the originalPosition
export interface LabelWithPositionMemo extends LabelDTO {
  originalPosition: Position | undefined;
}

export const updateDiagramsWithNode = (diagrams: DiagramDTO[], node: INodeData): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    if (diagram.id !== node.properties.diagramId || !node.properties.elementType) {
      return diagram;
    }

    const elementType = node.properties.elementType;
    if (elementType === PlanElementType.COORDINATES) {
      return {
        ...diagram,
        coordinates: diagram.coordinates.map((coordinate) =>
          coordinate.id === parseInt(node.id) ? mergeCoordinateData(coordinate, node) : coordinate,
        ),
      };
    } else if (elementType === PlanElementType.DIAGRAM) {
      const data = (node as IDiagramNodeData).properties;
      return {
        ...diagram,
        originPageOffset: {
          x: data.originPageX,
          y: data.originPageY,
        },
        zoomScale: data.zoomScale,
      };
    } else if (elementType === PlanElementType.PARCEL_LABELS) {
      return {
        ...diagram,
        parcelLabelGroups: diagram.parcelLabelGroups?.map((group) => {
          return {
            ...group,
            labels: group.labels.map((label) =>
              label.id === cytoscapeLabelIdToPlanData(node.id) ? mergeLabelData(label, node) : label,
            ),
          };
        }),
      };
    } else if (elementType === PlanElementType.CHILD_DIAGRAM_LABELS) {
      return {
        ...diagram,
        childDiagrams: diagram.childDiagrams?.map((group) => {
          return {
            ...group,
            labels: group.labels.map((label) =>
              label.id === cytoscapeLabelIdToPlanData(node.id) ? mergeLabelData(label, node) : label,
            ),
          };
        }),
      };
    } else if (
      elementType === PlanElementType.LABELS ||
      elementType === PlanElementType.COORDINATE_LABELS ||
      elementType === PlanElementType.LINE_LABELS
    ) {
      return {
        ...diagram,
        [elementType]: diagram[elementType].map((label) =>
          label.id === cytoscapeLabelIdToPlanData(node.id) ? mergeLabelData(label, node) : label,
        ),
      };
    } else {
      return diagram;
    }
  });
};

export const addPageLabels = (
  page: PageDTO,
  labelsProps: (Pick<LabelDTO, "id" | "displayText" | "position"> & Partial<LabelDTO>)[],
) => {
  const labels = labelsProps.map((labelProps) => {
    return {
      anchorAngle: 0,
      displayState: DisplayStateEnum.display,
      effect: "none",
      font: "Tahoma",
      fontSize: 14,
      fontStyle: "italic",
      labelType: LabelDTOLabelTypeEnum.userAnnotation,
      pointOffset: 0,
      rotationAngle: 0,
      textAlignment: "centerCenter",
      ...labelProps,
    };
  });
  return {
    ...page,
    labels: [...(page.labels ?? []), ...labels],
  };
};

export const updatePageLines = (page: PageDTO, linePropsArray: LinePropsToUpdate[]): PageDTO => {
  return {
    ...page,
    lines: page.lines?.map((line) => {
      const updatedProps = linePropsArray.find((props) => props.id === line.id);
      return updatedProps ? { ...line, ...updatedProps } : line;
    }),
  };
};

export const updateDiagramLines = (diagrams: DiagramDTO[], linePropsArray: LinePropsToUpdate[]): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    return {
      ...diagram,
      lines: diagram.lines?.map((line) => {
        const updatedProps = linePropsArray.find((props) => props.id === line.id);
        return updatedProps ? { ...line, ...updatedProps } : line;
      }),
    };
  });
};

export const updatePageLabels = (page: PageDTO, labelPropsArray: LabelPropsToUpdate[]): PageDTO => {
  return {
    ...page,
    labels: page.labels?.map((label) => {
      const updatedProps = labelPropsArray.find((props) => props.id === label.id);
      return updatedProps ? { ...label, ...updatedProps } : label;
    }),
  };
};

export const updateDiagramLabels = (
  diagrams: DiagramDTO[],
  labelArray: LabelPropsToUpdateWithElemType[],
): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    const updatedLabels = labelArray.filter((label) => Number(label.type.diagramId) === diagram.id);
    if (updatedLabels.length === 0) {
      return diagram;
    }

    let updatedDiagram = { ...diagram };

    updatedLabels.forEach((updatedLabel) => {
      const elemType = updatedLabel.type.elementType as
        | PlanElementType.LABELS
        | PlanElementType.COORDINATE_LABELS
        | PlanElementType.LINE_LABELS
        | PlanElementType.PARCEL_LABELS
        | PlanElementType.CHILD_DIAGRAM_LABELS;

      if (elemType === PlanElementType.PARCEL_LABELS) {
        updatedDiagram = {
          ...updatedDiagram,
          parcelLabelGroups: updatedDiagram.parcelLabelGroups?.map((group) => {
            return {
              ...group,
              labels: group.labels.map((label) =>
                label.id === updatedLabel.data.id ? { ...label, ...updatedLabel.data } : label,
              ),
            };
          }),
        };
      } else if (elemType === PlanElementType.CHILD_DIAGRAM_LABELS) {
        updatedDiagram = mapDiagramLabels(updatedDiagram, "childDiagrams", (label) =>
          label.id === updatedLabel.data.id ? { ...label, ...updatedLabel.data } : label,
        );
      } else {
        updatedDiagram = {
          ...updatedDiagram,
          [elemType]: updatedDiagram[elemType].map((label) =>
            label.id === updatedLabel.data.id ? { ...label, ...updatedLabel.data } : label,
          ),
        };
      }
    });
    return updatedDiagram;
  });
};

export const updatePageWithNode = (page: PageDTO, node: INodeData): PageDTO => {
  if (node.properties.elementType === PlanElementType.COORDINATES) {
    return {
      ...page,
      coordinates: page.coordinates?.map((coordinate) =>
        coordinate.id === parseInt(node.id) ? mergeCoordinateData(coordinate, node) : coordinate,
      ),
    };
  } else {
    return {
      ...page,
      labels: page.labels?.map((label) =>
        label.id === cytoscapeLabelIdToPlanData(node.id) ? mergeLabelData(label, node) : label,
      ),
    };
  }
};

export const updateDiagramsWithEdge = (diagrams: DiagramDTO[], edge: IEdgeData): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    if (diagram.id !== edge.properties.diagramId) {
      return diagram;
    }

    return {
      ...diagram,
      lines: diagram.lines.map((line) => (line.id === parseInt(edge.id) ? mergeLineData(line, edge) : line)),
    };
  });
};

const mergeLabelData = (label: LabelDTO, updatedNode: INodeData): LabelDTO => {
  const updated = updatedNode.properties;
  const rotationAngle = updated.textRotation ?? label.rotationAngle;
  const anchorAngle = updated.anchorAngle ?? label.anchorAngle;
  const pointOffset = updated.pointOffset ?? label.pointOffset;
  const textAlignment = updated.textAlignment ?? label.textAlignment;
  const displayState = updated.displayState ?? label.displayState;

  // Preserve an `originalPosition` for revert to original
  // If we have no `originalPosition` set for a page label, then create one
  // this gets the position before it is changed by this method
  return {
    ...label,
    displayText: updatedNode.label ?? label.displayText,
    position: updatedNode.position,
    originalPosition: (label as LabelWithPositionMemo).originalPosition ?? label.position,
    rotationAngle,
    anchorAngle,
    pointOffset,
    textAlignment,
    displayState,
  } as LabelDTO;
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
    // ensure that on any labels, the cytoscape/plangen id conversion is used
  };
};
