import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { degreesToRadians, point, polygon } from "@turf/helpers";
import { NodeSingular } from "cytoscape";
import { isNil, last, round } from "lodash-es";
import { useCallback } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { IGraphDataProperties, INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { textDimensions } from "@/components/CytoscapeCanvas/styleNodeMethods";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  LabelPropertiesData,
  LabelPropsToUpdate,
  LabelPropsToUpdateWithElemType,
} from "@/components/PlanSheets/properties/LabelProperties";
import {
  cytoscapeLabelIdToPlanData,
  getCorrectedLabelPosition,
  planDataLabelIdToCytoscape,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { LabelWithPositionMemo, updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import {
  getActivePage,
  getElementTypeConfigs,
  replaceDiagrams,
  replacePage,
  setAlignedLabelNodeId,
  setPlanMode,
} from "@/redux/planSheets/planSheetsSlice";
import { DiagramLabelField, findLabelById } from "@/util/diagramUtil";
import { atanDegrees360, clampAngleDegrees360, midPoint, subtractIntoDelta } from "@/util/positionUtil";

import { useAppDispatch, useAppSelector } from "./reduxHooks";

export const useLabelsFunctions = () => {
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const activePage = useAppSelector(getActivePage);
  const elemTypeConfigs = useAppSelector(getElementTypeConfigs);
  const dispatch = useAppDispatch();

  const getDefaultElementConfig = (labelType: string) => {
    const defaultElemConfigs = elemTypeConfigs.find(
      (config) => config.element === "Label" && config.elementType === labelType,
    )?.attribDefaults;

    return {
      defaultRotationAngle: defaultElemConfigs?.find((config) => config.attribute.includes("originalRotationAngle"))
        ?.defaultValue,
      defaultPointOffset: defaultElemConfigs?.find((config) => config.attribute.includes("originalPointOffset"))
        ?.defaultValue,
      defaultAnchorAngle: defaultElemConfigs?.find((config) => config.attribute.includes("originalAnchorAngle"))
        ?.defaultValue,
    };
  };

  const getLabelOriginalLocation = (labelData: INodeDataProperties) => {
    const newObj: LabelPropsToUpdate = { id: cytoscapeLabelIdToPlanData(labelData.id) };

    const defaultElemConfig = labelData.labelType ? getDefaultElementConfig(labelData.labelType) : undefined;
    if (!defaultElemConfig) return;
    if (!labelData.elementType) {
      throw new Error(`Element type not found for label with id ${labelData.id}`);
    }

    if (labelData.labelType === LabelDTOLabelTypeEnum.userAnnotation) {
      const pageLabel = activePage?.labels?.find((label) => `LAB_${label.id}` === labelData.id);
      if ((pageLabel as LabelWithPositionMemo | undefined)?.originalPosition) {
        // If we are a page label then revert to the original position
        // which is set in `mergeLabelData` (if the label has been moved)
        newObj.position = (pageLabel as LabelWithPositionMemo).originalPosition;
      }

      newObj.rotationAngle = Number(defaultElemConfig.defaultRotationAngle);
      newObj.anchorAngle = Number(defaultElemConfig.defaultAnchorAngle);
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
    } else if (labelData.elementType === PlanElementType.LINE_LABELS) {
      const activeLines = activeDiagrams.flatMap((diagram) => diagram?.lines);
      const line = activeLines.find((line) => line?.id === labelData.featureId);
      const diagram = activeDiagrams.find((diagram) => diagram.id === labelData.diagramId);
      const lineStartId = line?.coordRefs?.[0] as number;
      const lineEndId = last(line?.coordRefs) as number;
      const lineStartCoord = diagram?.coordinates.find((coord) => coord.id === lineStartId);
      const lineEndCoord = diagram?.coordinates.find((coord) => coord.id === lineEndId);
      if (!lineStartCoord || !lineEndCoord) return;
      const lineAngle = round(atanDegrees360(subtractIntoDelta(lineEndCoord.position, lineStartCoord.position)), 1);
      newObj.position = midPoint(lineStartCoord.position, lineEndCoord.position);
      newObj.rotationAngle = lineAngle;
      newObj.anchorAngle = clampAngleDegrees360(lineAngle + Number(defaultElemConfig.defaultAnchorAngle));
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
    } else if (labelData.elementType === PlanElementType.COORDINATE_LABELS) {
      const diagram = activeDiagrams.find((diagram) => diagram.id === labelData.diagramId);
      const coord = diagram?.coordinates.find((coord) => coord.id === labelData.featureId);
      if (!coord) {
        throw new Error(`Coordinate with id ${labelData.featureId} not found in diagram ${labelData.diagramId}`);
      }
      newObj.position = coord.position;
      newObj.rotationAngle = Number(defaultElemConfig.defaultRotationAngle);
      newObj.anchorAngle = Number(defaultElemConfig.defaultAnchorAngle);
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
    } else if (
      [
        PlanElementType.LABELS,
        PlanElementType.PARCEL_LABELS,
        PlanElementType.CHILD_DIAGRAM_LABELS,
        PlanElementType.DIAGRAM,
        PlanElementType.CHILD_DIAGRAM_LABELS,
      ].includes(labelData.elementType)
    ) {
      const diagram = activeDiagrams.find((diagram) => diagram.id === labelData.diagramId);
      if (!diagram) {
        throw new Error(`Diagram with id ${labelData.diagramId} not found`);
      }
      const label = findLabelById(
        diagram,
        labelData.elementType?.valueOf() as DiagramLabelField,
        labelData.id as string,
      );
      if (!label) {
        throw new Error(`Label with id ${labelData.featureId} not found in diagram ${labelData.diagramId}`);
      }
      if ((label as LabelWithPositionMemo | undefined)?.originalPosition) {
        // If we are a parcel label then revert to the original position
        // which is set in `mergeLabelData` (if the label has been moved)
        newObj.position = (label as LabelWithPositionMemo).originalPosition;
        // console.log(`revert position to originalPosition=${JSON.stringify(newObj.position)}`);
      }
      newObj.rotationAngle = Number(defaultElemConfig.defaultRotationAngle);
      newObj.anchorAngle = Number(defaultElemConfig.defaultAnchorAngle);
      newObj.pointOffset = Number(defaultElemConfig.defaultPointOffset);
      // console.log(`Reverted newObj to ${JSON.stringify(newObj)}`);
    }
    return newObj;
  };

  const updateLabels = useCallback(
    (labelsPropsToUpdate: LabelPropsToUpdate[], selectedLabelsData: INodeDataProperties[] | LabelPropertiesData[]) => {
      // Update diagram labels
      const diagramLabelsToUpdate = labelsPropsToUpdate
        .filter((label) =>
          selectedLabelsData.some(
            (selectedLabel) =>
              selectedLabel.id === planDataLabelIdToCytoscape(label.id) && !isNil(selectedLabel.diagramId),
          ),
        )
        .map((label) => {
          const selectedLabel = selectedLabelsData.find(
            (selectedLabel) => selectedLabel.id === planDataLabelIdToCytoscape(label.id),
          );
          return {
            data: label,
            type: {
              elementType: selectedLabel?.elementType,
              diagramId: selectedLabel?.diagramId?.toString(),
            },
          };
        });
      diagramLabelsToUpdate.length > 0 &&
        dispatch(replaceDiagrams(updateDiagramLabels(activeDiagrams, diagramLabelsToUpdate)));

      // Update page labels (do not applyOnDataChanging if it was already done in replaceDiagrams, so the undo works correctly)
      if (!activePage) return;
      const applyOnDataChangingToPageLabels = diagramLabelsToUpdate.length === 0;
      const pageLabelsToUpdate = labelsPropsToUpdate.filter((label) =>
        selectedLabelsData.some(
          (selectedLabel) =>
            selectedLabel.id === planDataLabelIdToCytoscape(label.id) && isNil(selectedLabel.diagramId),
        ),
      );
      pageLabelsToUpdate.length > 0 &&
        dispatch(
          replacePage({
            updatedPage: updatePageLabels(activePage, pageLabelsToUpdate),
            applyOnDataChanging: applyOnDataChangingToPageLabels,
          }),
        );
    },
    [dispatch, activeDiagrams, activePage],
  );

  const setOriginalLocation = (selectedLabels: cytoscape.NodeCollection) => {
    const selectedLabelsData = selectedLabels.map((label) => label.data() as INodeDataProperties);
    const labelsOriginalLocation: LabelPropsToUpdate[] = selectedLabelsData
      .map((label) => getLabelOriginalLocation(label))
      .filter((elem) => !isNil(elem));

    const cyto = selectedLabels[0]?.cy();
    const container = cyto?.container();
    const cytoCoordMapper = container ? new CytoscapeCoordinateMapper(container, activeDiagrams) : null;
    if (!cytoCoordMapper) return;

    // for each selected label, evaluate if its position should be forced to fit within the page area
    selectedLabelsData.forEach((label) => {
      if (!label.id) return;

      const positionCoord = getCorrectedLabelPosition(
        cyto,
        cytoCoordMapper,
        label.id,
        "originalLocation",
        JSON.parse(
          JSON.stringify(labelsOriginalLocation.find((l) => l.id === cytoscapeLabelIdToPlanData(label.id)) ?? {}),
        ) as LabelPropsToUpdate,
      );
      if (!positionCoord) return;
      labelsOriginalLocation.find((l) => l.id === cytoscapeLabelIdToPlanData(label.id))!.position = positionCoord;
    });

    updateLabels(labelsOriginalLocation, selectedLabelsData);
  };

  const filterNonSystemLabels = (labels: cytoscape.NodeCollection) => {
    return labels.filter((ele) => {
      const displayState = ele.data("displayState") as string;
      return !([DisplayStateEnum.systemDisplay, DisplayStateEnum.systemHide] as string[]).includes(displayState);
    });
  };

  const updateLabelsDisplayState = (labels: cytoscape.NodeCollection | undefined, displayState: "display" | "hide") => {
    if (!labels || !activePage) return;
    const nonSystemLabels = filterNonSystemLabels(labels);
    const diagramLabels = nonSystemLabels?.filter((label) => label.data("diagramId") !== undefined);
    const diagramLabelsToUpdateWithElemType: LabelPropsToUpdateWithElemType[] = diagramLabels.map((label) => {
      const labelData = label.data() as IGraphDataProperties;
      return {
        data: {
          id: cytoscapeLabelIdToPlanData(labelData.id),
          displayState,
        },
        type: {
          elementType: labelData.elementType,
          diagramId: labelData.diagramId?.toString(),
        },
      };
    });
    dispatch(replaceDiagrams(updateDiagramLabels(activeDiagrams, diagramLabelsToUpdateWithElemType)));

    const pageLabels = nonSystemLabels.filter((label) => label.data("diagramId") === undefined);
    const pageLabelsToUpdate: LabelPropsToUpdate[] = pageLabels.map((label) => ({
      id: cytoscapeLabelIdToPlanData(label.data("id") as string),
      displayState,
    }));
    dispatch(
      replacePage({ updatedPage: updatePageLabels(activePage, pageLabelsToUpdate), applyOnDataChanging: false }),
    );
  };

  const alignLabelToLine = (selectedLabel: cytoscape.CollectionArgument) => {
    const labelNodeId = selectedLabel.data("id") as string;
    if (!labelNodeId) return;
    dispatch(setPlanMode(PlanMode.SelectTargetLine));
    dispatch(setAlignedLabelNodeId({ nodeId: labelNodeId }));
  };

  const getStackedLabels = (targetLabel: NodeSingular, clickedPosition: cytoscape.Position) => {
    const container = targetLabel.cy()?.container();
    if (!container) return [];
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(container, activeDiagrams);

    const targetClickedPosition = { x: clickedPosition.x, y: clickedPosition.y + 7 };
    const stackedLabels: cytoscape.NodeSingular[] = [];

    // Find the labels that are close to the clicked position by checking their bounding box
    const closeLabels = targetLabel
      .cy()
      .nodes()
      .filter((node) => {
        return isPositionInElem(targetClickedPosition, node) && isLabel(node.data("elementType") as PlanElementType);
      });

    // Check if the clicked position is inside the labels actual area
    closeLabels.forEach((label) => {
      const textDim = textDimensions(label, cytoscapeCoordinateMapper);
      const halfTextDimWidth = textDim.width / 2;
      const halfTextDimHeight = textDim.height / 2;
      const labelCenter = { x: label.position().x, y: label.position().y + 7 };
      // [top-left, top-right, bottom-right, bottom-left]
      const labelPolygonHoriz: cytoscape.Position[] = [
        { x: labelCenter.x - halfTextDimWidth, y: labelCenter.y + halfTextDimHeight },
        { x: labelCenter.x + halfTextDimWidth, y: labelCenter.y + halfTextDimHeight },
        { x: labelCenter.x + halfTextDimWidth, y: labelCenter.y - halfTextDimHeight },
        { x: labelCenter.x - halfTextDimWidth, y: labelCenter.y - halfTextDimHeight },
      ];
      const labelTextRotation = -label.data("textRotation"); // negative because is counter clockwise
      // Rotate the label polygon
      const labelPolygonRotated = labelPolygonHoriz.map((point) => {
        const labelTextRotationRadians = degreesToRadians(labelTextRotation);
        return {
          x:
            labelCenter.x +
            (point.x - labelCenter.x) * Math.cos(labelTextRotationRadians) -
            (point.y - labelCenter.y) * Math.sin(labelTextRotationRadians),
          y:
            labelCenter.y +
            (point.x - labelCenter.x) * Math.sin(labelTextRotationRadians) +
            (point.y - labelCenter.y) * Math.cos(labelTextRotationRadians),
        };
      });
      const labelPolygon = labelPolygonRotated.map((point) => [point.x, point.y]);
      const turfPoint = point([targetClickedPosition.x, targetClickedPosition.y]);
      labelPolygon[0] && labelPolygon.push(labelPolygon[0]); //First and last Position need to be equivalent to be a turf polygon
      const turfPolygon = polygon([labelPolygon]);
      const isInside = booleanPointInPolygon(turfPoint, turfPolygon);
      // filter the labels that match the clicked position and are not nodeSymbol
      if (isInside && isNil(label.data("symbolId"))) stackedLabels.push(label);
    });
    return stackedLabels;
  };

  const isPositionInElem = (position: cytoscape.Position, elem: NodeSingular) => {
    const elemBbox = elem.boundingBox();
    return (
      position.x >= elemBbox.x1 && position.x <= elemBbox.x2 && position.y >= elemBbox.y1 && position.y <= elemBbox.y2
    );
  };

  const isLabel = (elementType: PlanElementType) => {
    return [
      PlanElementType.LABELS,
      PlanElementType.PARCEL_LABELS,
      PlanElementType.LINE_LABELS,
      PlanElementType.COORDINATE_LABELS,
      PlanElementType.CHILD_DIAGRAM_LABELS,
    ].includes(elementType);
  };

  return {
    setOriginalLocation,
    updateLabels,
    filterNonSystemLabels,
    updateLabelsDisplayState,
    alignLabelToLine,
    getStackedLabels,
    isPositionInElem,
    isLabel,
  };
};
