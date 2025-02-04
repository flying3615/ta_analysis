import { LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { degreesToRadians } from "@turf/helpers";
import { cloneDeep, last, round } from "lodash-es";

import { GroundMetresPosition } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanCoordinateMapper } from "@/components/CytoscapeCanvas/PlanCoordinateMapper";
import { LabelWithPositionMemo } from "@/modules/plan/updatePlanData";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { lineMidpoint, mapAllDiagramLabels, mapDiagramLabels } from "@/util/diagramUtil";
import {
  addIntoPosition,
  atanDegrees360,
  deltaFromPolar,
  hypotenuse,
  midPoint,
  subtractIntoDelta,
} from "@/util/positionUtil";

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
  return addIntoPosition(label.position, offsetDelta);
};

export const normalizePlanData = (planData: PlanResponseDTO, irregularLineMidpointMode: boolean): PlanResponseDTO => {
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

    if (coordinatePosition.x === label.position.x && coordinatePosition.y === label.position.y) {
      return {
        ...label,
        pointOffset: round(label.pointOffset, 2),
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
      return labelDTOPositionToOffsetAndAngle(diagram.id, parentCoordinate.position, coordinateLabel);
    });

    const diagramWithNormalizedLineLabels = mapDiagramLabels(
      diagramWithNormalizedCoordinateLabels,
      "lineLabels",
      (lineLabel) => {
        const parentLine = diagram.lines.find((line) => line.id === lineLabel.featureId);
        if (!parentLine) {
          throw new Error(`Line with id ${lineLabel.featureId} not found`);
        }

        let lineLabelCoordinate;
        if (irregularLineMidpointMode) {
          if (!planData.surveyCentreLatitude) {
            console.error(`normalisePlanData surveyCentreLatitude not provided, we can't calculate line midpoint`);
            throw new Error(`normalisePlanData surveyCentreLatitude not provided, we can't calculate line midpoint`);
          }

          lineLabelCoordinate = lineMidpoint(planData.surveyCentreLatitude, diagram, parentLine.coordRefs);
        } else {
          const parentLine = diagram.lines.find((line) => line.id === lineLabel.featureId);
          if (!parentLine) {
            throw new Error(`Line with id ${lineLabel.featureId} not found`);
          }

          const lineStartId = parentLine.coordRefs?.[0] as number;
          const lineEndId = last(parentLine.coordRefs) as number;
          const lineStartCoord = diagram.coordinates.find((coord) => coord.id === lineStartId);
          const lineEndCoord = diagram.coordinates.find((coord) => coord.id === lineEndId);
          if (!lineStartCoord || !lineEndCoord) throw new Error("Line start or end coordinates not found");
          lineLabelCoordinate = midPoint(lineStartCoord.position, lineEndCoord.position);
        }

        return labelDTOPositionToOffsetAndAngle(diagram.id, lineLabelCoordinate, lineLabel);
      },
    );

    const diagramWithNormalizedNonCoordLabels = mapDiagramLabels(
      diagramWithNormalizedLineLabels,
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
