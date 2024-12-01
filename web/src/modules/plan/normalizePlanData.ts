import { LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { degreesToRadians } from "@turf/helpers";
import { cloneDeep, round } from "lodash-es";

import { GroundMetresPosition } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanCoordinateMapper } from "@/components/CytoscapeCanvas/PlanCoordinateMapper";
import { LabelWithPositionMemo } from "@/modules/plan/updatePlanData";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { mapAllDiagramLabels, mapDiagramLabels } from "@/util/diagramUtil";
import { addIntoPosition, atanDegrees360, deltaFromPolar, hypotenuse, subtractIntoDelta } from "@/util/positionUtil";

export const labelOffsetAndAngleToBasePosition = (
  planCoordinateMapper: PlanCoordinateMapper,
  diagramId: number | undefined,
  label: LabelDTO,
): GroundMetresPosition => {
  // console.log(`labelOffsetAndAngleToBasePosition ${JSON.stringify(label)}`);
  const coordinateOffset = diagramId
    ? planCoordinateMapper.pointsToGroundDistance(diagramId, label.pointOffset)
    : label.pointOffset / (POINTS_PER_CM * 100);
  const offsetDelta = deltaFromPolar(label.anchorAngle, coordinateOffset);
  const resPosition = addIntoPosition(label.position, offsetDelta);
  // console.log(`labelOffsetAndAngleToBasePosition ${JSON.stringify(resPosition)}`);
  return resPosition;
};

export const normalizePlanData = (planData: PlanResponseDTO): PlanResponseDTO => {
  const planCoordinateMapper = new PlanCoordinateMapper(planData.diagrams);

  const labelDTOPositionToOffsetAndAngle = (
    diagramId: number | undefined,
    coordinatePosition: GroundMetresPosition,
    label: LabelDTO,
  ): LabelWithPositionMemo | LabelDTO => {
    if (label.symbolType === "lolSymbols") {
      // Mark symbols are always concentric with the coordinate
      return {
        ...label,
        pointOffset: 0,
        anchorAngle: 0,
        position: coordinatePosition,
      };
    }

    const existingAnchorAngleDegs = label.anchorAngle;
    const existingAngleRadsAntiClockwise = degreesToRadians(existingAnchorAngleDegs);
    const existingPointOffset = label.pointOffset;

    // This is in ground metres for diagrams and plan metres for plans
    const existingCoordinateOffset = diagramId
      ? planCoordinateMapper.pointsToGroundDistance(diagramId, existingPointOffset)
      : existingPointOffset / (POINTS_PER_CM * 100);

    const existingCoordinateDelta = {
      x: Math.cos(existingAngleRadsAntiClockwise) * existingCoordinateOffset,
      y: Math.sin(existingAngleRadsAntiClockwise) * existingCoordinateOffset,
    };

    const labelAbsolutePosition = addIntoPosition(label.position, existingCoordinateDelta);

    const newCoordinateDelta = subtractIntoDelta(labelAbsolutePosition, coordinatePosition);

    const newCoordinateOffset = hypotenuse(newCoordinateDelta);
    const pointOffset = round(
      diagramId
        ? planCoordinateMapper.groundDistanceToPoints(diagramId, newCoordinateOffset)
        : newCoordinateOffset * POINTS_PER_CM * 100,
      2,
    );

    const anchorAngle = atanDegrees360(newCoordinateDelta);

    // console.log(
    //  `labelDTOPositionToOffsetAndAngle: ${JSON.stringify(label)} new: ${pointOffset} ${anchorAngle} ${JSON.stringify(coordinatePosition)}`,
    // );
    return {
      ...label,
      pointOffset,
      anchorAngle,
      position: coordinatePosition,
    };
  };

  const normalizedDiagrams = planData.diagrams.map((diagram) => {
    const diagramWithNormalizedCoordinateLabels = mapDiagramLabels(diagram, "coordinateLabels", (coordinateLabel) => {
      const parentCoordinate = diagram.coordinates.find((coordinate) => coordinate.id === coordinateLabel.featureId);
      if (!parentCoordinate) {
        throw new Error(`Coordinate with id ${coordinateLabel.featureId} not found`);
      }
      if (coordinateLabel.symbolType === "lolSymbols") {
        // The symbol stays concentric with the coordinate
        return {
          ...coordinateLabel,
          position: parentCoordinate.position,
          pointOffset: 0,
          anchorAngle: 0,
        };
      }

      if (
        parentCoordinate.position.x === coordinateLabel.position.x &&
        parentCoordinate.position.y === coordinateLabel.position.y
      ) {
        return {
          ...coordinateLabel,
          pointOffset: round(coordinateLabel.pointOffset, 2),
        };
      }
      return labelDTOPositionToOffsetAndAngle(diagram.id, parentCoordinate.position, coordinateLabel);
    });

    const diagramWithNormalizedNonCoordLabels = mapDiagramLabels(
      diagramWithNormalizedCoordinateLabels,
      ["parcelLabels", "childDiagrams", "labels"],
      (label: LabelDTO) => {
        // console.log(`normlizeDiagrams ${JSON.stringify(label)}`);
        return labelDTOPositionToOffsetAndAngle(
          diagram.id,
          (label as LabelWithPositionMemo)?.originalPosition ?? label.position,
          label,
        );
      },
    );

    return mapAllDiagramLabels(diagramWithNormalizedNonCoordLabels, (label: LabelDTO) => {
      const normalizedLabel = cloneDeep(label);
      delete (normalizedLabel as LabelWithPositionMemo).originalPosition;
      return normalizedLabel;
    });
  });

  const normalizedPages = planData.pages.map((page) => {
    const normalizedPageLabels = page.labels?.map((label) => {
      const pageLabel = label as LabelWithPositionMemo;
      if (!pageLabel.originalPosition) return pageLabel;

      const normalizedLabel = labelDTOPositionToOffsetAndAngle(undefined, pageLabel.originalPosition, pageLabel);
      delete (normalizedLabel as LabelWithPositionMemo).originalPosition;
      return normalizedLabel as LabelDTO;
    });

    return { ...page, labels: normalizedPageLabels };
  });

  return { diagrams: normalizedDiagrams, pages: normalizedPages } as PlanResponseDTO;
};
