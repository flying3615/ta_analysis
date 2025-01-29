import { LabelDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { degreesToRadians } from "@turf/helpers";
import cytoscape, { Position } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { textDimensions } from "@/components/CytoscapeCanvas/styleNodeMethods";
import {
  cytoscapeLabelIdToPlanData,
  planDataLabelIdToCytoscape,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { addPageLabels } from "@/modules/plan/updatePlanData";
import {
  doPastePageLabels,
  getActivePage,
  getCopiedElements,
  getMaxElemIds,
  removePageLabels,
  setCopiedElements,
  updateMaxElemIds,
} from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

export const usePageLabelEdit = (cyto?: cytoscape.Core) => {
  const container = cyto?.container();
  const cytoCoordMapper = container && new CytoscapeCoordinateMapper(container, []);
  const diagramAreasLimits = cytoCoordMapper && cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
  const dispatch = useAppDispatch();
  const copiedElements = useAppSelector(getCopiedElements);
  const activePage = useAppSelector(getActivePage);
  const maxElemIds = useAppSelector(getMaxElemIds);
  const { cleanupSelectedElements } = useCytoscapeContext();

  const deletePageLabels = (targets: cytoscape.NodeSingular[]) => {
    const labelIds = targets
      .filter((target) => target.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation)
      .map((target) => cytoscapeLabelIdToPlanData(target.data("id") as string));
    dispatch(removePageLabels({ labelIds: [...new Set(labelIds)] }));
  };

  const copyPageLabels = (targets: cytoscape.NodeSingular[]) => {
    if (!activePage) return;

    const labelIds = targets
      .filter((target) => target.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation)
      .map((target) => cytoscapeLabelIdToPlanData(target.data("id") as string));
    if (labelIds.length === 0) return;
    dispatch(setCopiedElements({ ids: [...new Set(labelIds)], type: "label", action: "COPY", pageId: activePage.id }));
  };

  const cutPageLabels = (targets: cytoscape.NodeSingular[]) => {
    if (!activePage) return;

    const labelIds = targets
      .filter((target) => target.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation)
      .map((target) => cytoscapeLabelIdToPlanData(target.data("id") as string));
    if (labelIds.length === 0) return;

    dispatch(setCopiedElements({ ids: [...new Set(labelIds)], type: "label", action: "CUT", pageId: activePage.id }));
  };

  const pastePageLabels = (clickPosition: Position) => {
    if (
      !copiedElements ||
      !activePage ||
      !cytoCoordMapper ||
      !diagramAreasLimits?.availableAreaLimitWithPageBlockPx ||
      !cyto
    )
      return;

    const position = cytoCoordMapper.pageLabelCytoscapeToCoord(clickPosition);

    const getElementsCenterPosition = () => {
      if (!copiedElements) return { x: 0, y: 0 };

      let x = 0;
      let y = 0;
      copiedElements.elements
        .filter((ele): ele is LabelDTO => !!ele)
        .forEach((ele) => {
          const label = ele;
          x += label.position.x;
          y += label.position.y;
        });
      return { x: x / copiedElements.elements.length, y: y / copiedElements.elements.length };
    };

    const calculatePushedFromBorderDelta = (
      position: Position,
      label: LabelDTO,
      centerPosition: {
        x: number;
        y: number;
      },
      labelSize: {
        width: number;
        height: number;
      },
      cytoCoordMapper: CytoscapeCoordinateMapper,
    ) => {
      if (!cytoCoordMapper || !diagramAreasLimits?.diagramOuterLimitsPx) return { deltaX: 0, deltaY: 0 };

      const convertedAvailableAreasLimitsTopLeft = cytoCoordMapper.pageLabelCytoscapeToCoord({
        x: diagramAreasLimits.availableAreaLimitWithPageBlockPx.x1,
        y: diagramAreasLimits.availableAreaLimitWithPageBlockPx.y1,
      });
      const convertedAvailableAreasLimitsRightBottom = cytoCoordMapper.pageLabelCytoscapeToCoord({
        x: diagramAreasLimits.availableAreaLimitWithPageBlockPx.x2,
        y: diagramAreasLimits.availableAreaLimitWithPageBlockPx.y2,
      });

      // if it's vertical, cos is 0, deltaX is half of the height as x-axis value, else it's based on the angle
      const labelHalfWidth = Math.abs(
        (labelSize.width / 2) * Math.cos(degreesToRadians(label.rotationAngle)) || labelSize.height / 2,
      );

      // if it's horizontal, sin is 0, deltaY is half of the height as y-axis value, else it's based on the angle
      const labelHalfHeight = Math.abs(
        (labelSize.width / 2) * Math.sin(degreesToRadians(label.rotationAngle)) || labelSize.height / 2,
      );

      const targetLeftBoundary = position.x + label.position.x - centerPosition.x - labelHalfWidth;
      const targetRightBoundary = position.x + label.position.x - centerPosition.x + labelHalfWidth;

      let deltaX;
      if (targetLeftBoundary < convertedAvailableAreasLimitsTopLeft.x) {
        const leftMost = convertedAvailableAreasLimitsTopLeft.x;
        deltaX = leftMost - targetLeftBoundary;
      } else if (targetRightBoundary > convertedAvailableAreasLimitsRightBottom.x) {
        const rightMost = convertedAvailableAreasLimitsRightBottom.x;
        deltaX = rightMost - targetRightBoundary;
      } else {
        deltaX = 0;
      }

      const targetTopBoundary = position.y + label.position.y - centerPosition.y - -labelHalfHeight;
      const targetBottomBoundary = position.y + label.position.y - centerPosition.y + -labelHalfHeight;

      let deltaY;
      // targetTopBoundary should be always negative, if it's positive, it means out of the page
      if (Math.abs(targetTopBoundary) < Math.abs(convertedAvailableAreasLimitsTopLeft.y) || targetTopBoundary > 0) {
        const topMost = convertedAvailableAreasLimitsTopLeft.y;
        deltaY = targetTopBoundary - topMost;
      } else if (Math.abs(targetBottomBoundary) > Math.abs(convertedAvailableAreasLimitsRightBottom.y)) {
        const bottomMost = convertedAvailableAreasLimitsRightBottom.y;
        deltaY = targetBottomBoundary - bottomMost;
      } else {
        deltaY = 0;
      }
      return { deltaX, deltaY };
    };

    const centerPosition = getElementsCenterPosition();
    const labelsTobeAdded: LabelDTO[] = [];

    const deltaXs: number[] = [];
    const deltaYs: number[] = [];

    copiedElements.elements.forEach((ele) => {
      const label = ele as LabelDTO;
      const cytoEle = cyto.getElementById(planDataLabelIdToCytoscape(ele.id));
      if (!cytoEle) return;

      const textDim = textDimensions(cytoEle, cytoCoordMapper);
      const { x, y } = cytoCoordMapper.pageLabelCytoscapeToCoord({ x: textDim.width, y: textDim.height });

      const labelSize = {
        width: x,
        height: y,
      };
      const { deltaX, deltaY } = calculatePushedFromBorderDelta(
        position,
        label,
        centerPosition,
        labelSize,
        cytoCoordMapper,
      );
      deltaX && deltaXs.push(deltaX);
      deltaY && deltaYs.push(deltaY);
    });

    // find the max delta x and y based on its absolute value
    const maxDeltaX =
      deltaXs.length > 0 ? (deltaXs.every((delta) => delta > 0) ? Math.max(...deltaXs) : Math.min(...deltaXs)) : 0;
    const maxDeltaY =
      deltaYs.length > 0 ? (deltaYs.every((delta) => delta > 0) ? Math.max(...deltaYs) : Math.min(...deltaYs)) : 0;

    const maxId = maxElemIds.find((elem) => elem.element === "Label")?.maxId;
    if (!maxId) throw Error("No maxId found");

    let newMaxId: number | undefined;

    copiedElements.elements.forEach((ele, index) => {
      const label = ele as LabelDTO;
      const newX = position.x + label.position.x - centerPosition.x + (maxDeltaX || 0);
      const newY = position.y + label.position.y - centerPosition.y - (maxDeltaY || 0);
      newMaxId = maxId + index + 1;

      const labelTobeAdded = {
        ...label,
        id: newMaxId,
        displayText: label.editedText || label.displayText,
        position: { x: newX, y: newY },
        rotationAngle: label.rotationAngle,
      } as LabelDTO;
      labelsTobeAdded.push(labelTobeAdded);
    });

    newMaxId && dispatch(updateMaxElemIds({ element: "Label", maxId: newMaxId }));

    const updatedPage = addPageLabels(activePage, labelsTobeAdded);
    cleanupSelectedElements(() => dispatch(doPastePageLabels({ updatedPage })));
  };

  return {
    deletePageLabels,
    copyPageLabels,
    pastePageLabels,
    cutPageLabels,
  };
};
