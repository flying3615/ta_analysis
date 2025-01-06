import { DiagramDTO, LabelDTO, PageDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { max, min } from "lodash-es";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanCoordinateMapper } from "@/components/CytoscapeCanvas/PlanCoordinateMapper";
import { useMeasureText } from "@/hooks/useMeasureText";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { BoundingBoxWithShift, calculateLabelBoundingBox } from "@/util/labelUtil";
import { atanDegrees360, hypotenuse } from "@/util/positionUtil";

const shiftIntoBounds = ({ originalShift, xL, xR, yT, yB }: BoundingBoxWithShift) => {
  const newXL = max([xL, CytoscapeCoordinateMapper.diagramLimitOriginX]) ?? 0;
  const newXR = min([xR, CytoscapeCoordinateMapper.diagramLimitBottomRightX]) ?? 0;
  const newYT = min([yT, CytoscapeCoordinateMapper.diagramLimitOriginY]) ?? 0;
  const newYB = max([yB, CytoscapeCoordinateMapper.diagramLimitBottomRightY]) ?? 0;

  const shift = {
    dx: newXL > xL ? originalShift.dx + (newXL - xL) : newXR < xR ? originalShift.dx + newXR - xR : originalShift.dx,
    dy: newYT < yT ? originalShift.dy + newYT - yT : newYB > yB ? originalShift.dy + newYB - yB : originalShift.dy,
  };

  const pointOffset = hypotenuse(shift) * POINTS_PER_CM;
  const anchorAngle = atanDegrees360(shift);
  return { pointOffset, anchorAngle };
};

const outsideBounds = ({ xL, xR, yT, yB }: BoundingBoxWithShift) =>
  xL >= CytoscapeCoordinateMapper.diagramLimitOriginX &&
  xR <= CytoscapeCoordinateMapper.diagramLimitBottomRightX &&
  yT <= CytoscapeCoordinateMapper.diagramLimitOriginY &&
  yB >= CytoscapeCoordinateMapper.diagramLimitBottomRightY;

export const useAdjustLoadedPlanData = () => {
  const measureTextCm = useMeasureText();

  const relocateOffscreenLabel = (planCoordinateMapper: PlanCoordinateMapper, diagramId: number, label: LabelDTO) => {
    const labelPositionCm = planCoordinateMapper.groundCoordToCm(diagramId, label.position);
    const labelSizeCm = measureTextCm(label.editedText ?? label.displayText ?? "", label.font, label.fontSize);

    const labelBounds = calculateLabelBoundingBox(
      labelPositionCm,
      labelSizeCm,
      label.textAlignment,
      label.anchorAngle,
      label.pointOffset,
      label.rotationAngle,
    );

    if (outsideBounds(labelBounds)) {
      return label;
    }
    const shift = shiftIntoBounds(labelBounds);
    label.pointOffset = shift.pointOffset;
    label.anchorAngle = shift.anchorAngle;
    return label;
  };

  const adjustDiagram = (diagram: DiagramDTO): DiagramDTO => {
    const originAdjustedDiagram =
      diagram.originPageOffset?.x === 0 && diagram.originPageOffset?.y === 0
        ? {
            ...diagram,
            originPageOffset: {
              x: CytoscapeCoordinateMapper.diagramLimitOriginX / 100,
              y: CytoscapeCoordinateMapper.diagramLimitOriginY / 100,
            },
          }
        : diagram;

    const planCoordinateMapper = new PlanCoordinateMapper([originAdjustedDiagram]);
    return {
      ...originAdjustedDiagram,
      labels: originAdjustedDiagram.labels?.map((label) => {
        return relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label);
      }),
      coordinateLabels: originAdjustedDiagram.coordinateLabels?.map((label) => {
        return relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label);
      }),
      lineLabels: originAdjustedDiagram.lineLabels?.map((label) => {
        return relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label);
      }),
      parcelLabelGroups: originAdjustedDiagram.parcelLabelGroups?.map((group) => {
        return {
          ...group,
          labels: group.labels.map((label) =>
            relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label),
          ),
        };
      }),
    };
  };

  const adjustPage = (page: PageDTO): PageDTO => {
    return {
      ...page,
      // if any page labels have `editedText` set, move this to `displayText`
      labels: page.labels?.map((label) => {
        if (label.editedText) {
          label.displayText = label.editedText;
          delete label.editedText;
        }
        return label;
      }),
    };
  };

  const adjustPlanData = (response: PlanResponseDTO): PlanResponseDTO => {
    const diagrams = response.diagrams;
    return {
      ...response,

      diagrams: diagrams?.map((d) => adjustDiagram(d)) ?? [],
      pages: response.pages?.map((page) => adjustPage(page)) ?? [],
    };
  };

  const adjustLabelNodes = (nodes: INodeData[], diagrams: DiagramDTO[]): INodeData[] => {
    if (nodes.every((ele) => ele.label)) {
      return nodes;
    }

    const planCoordinateMapper = new PlanCoordinateMapper(diagrams);

    return nodes.map((unadjustedNode) => {
      // We don't shove symbols back in
      if (!unadjustedNode.label || unadjustedNode.properties.symbolId) return unadjustedNode;

      const labelPositionCm = unadjustedNode.properties.diagramId
        ? planCoordinateMapper.groundCoordToCm(unadjustedNode.properties.diagramId, unadjustedNode.position)
        : unadjustedNode.position;

      const labelSizeCm = measureTextCm(
        unadjustedNode.label ?? "",
        unadjustedNode.properties.font,
        unadjustedNode.properties.fontSize,
      );

      const labelBounds = calculateLabelBoundingBox(
        labelPositionCm,
        labelSizeCm,
        unadjustedNode.properties.textAlignment,
        unadjustedNode.properties.anchorAngle,
        unadjustedNode.properties.pointOffset,
        unadjustedNode.properties.textRotation,
      );

      if (outsideBounds(labelBounds)) {
        return unadjustedNode;
      }
      const { pointOffset, anchorAngle } = shiftIntoBounds(labelBounds);

      return {
        ...unadjustedNode,
        properties: {
          ...unadjustedNode.properties,
          pointOffset: pointOffset,
          anchorAngle: anchorAngle,
        },
      } as INodeData;
    });
  };

  return {
    adjustPlanData,
    adjustDiagram,
    adjustLabelNodes,
  };
};
