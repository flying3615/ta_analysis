import { CoordinateDTO, DiagramDTO, LabelDTO, LineDTO } from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export const updateDiagramsWithNode = (diagrams: DiagramDTO[], node: INodeData): DiagramDTO[] => {
  return diagrams.map((diagram) => {
    if (node.properties["elementType"] === "coordinates") {
      return {
        ...diagram,
        coordinates: diagram.coordinates.map((coordinate) =>
          coordinate.id === parseInt(node.id) ? mergeCoordinateData(coordinate, node) : coordinate,
        ),
      };
    } else {
      const labelType = node.properties["elementType"] as "labels" | "coordinateLabels" | "lineLabels" | "parcelLabels";
      return {
        ...diagram,
        [labelType]: diagram[labelType].map((label) =>
          label.id === parseInt(node.id) ? mergeLabelData(label, node) : label,
        ),
      };
    }
  });
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
  return {
    ...label,
    position: updatedNode.position,
    // TODO: Handle updating label node data
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
