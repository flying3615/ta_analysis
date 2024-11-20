import { LineDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { Position } from "cytoscape";
import { useCallback } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  getActivePage,
  getCopiedElements,
  getPageByRef,
  removePageLines,
  replacePage,
  setCopiedElements,
} from "@/redux/planSheets/planSheetsSlice";
import { addPageLineByCoordList, cytoscapeUtils } from "@/util/cytoscapeUtil";

export const usePageLineEdit = (cyto?: cytoscape.Core) => {
  const dispatch = useAppDispatch();
  const container = cyto?.container();
  const activePage = useAppSelector(getActivePage);
  const getPageByPageId = useAppSelector(getPageByRef);
  const cytoCoordMapper = container && new CytoscapeCoordinateMapper(container, []);
  const diagramAreasLimits = cytoCoordMapper && cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
  const copiedElements = useAppSelector(getCopiedElements);
  const getCyMaxId = useCallback(() => cytoscapeUtils.findMaxId(cyto), [cyto]);

  const deletePageLines = (targets: cytoscape.EdgeSingular[]) => {
    const lineIds = targets
      .filter((target) => target.data("lineType") === "userDefined")
      .map((target) => target.data("lineId") as string);

    if (lineIds.length === 0) return;

    dispatch(removePageLines({ lineIds: [...new Set(lineIds)] }));
  };

  const cutPageLines = (targets: cytoscape.EdgeSingular[]) => {
    if (!activePage) return;
    const lineIds = targets
      .filter((target) => target.data("lineType") === "userDefined")
      .map((target) => Number(target.data("lineId")));

    if (lineIds.length === 0) return;

    dispatch(setCopiedElements({ ids: [...new Set(lineIds)], type: "line", action: "CUT", pageId: activePage.id }));
  };

  const copyPageLines = (targets: cytoscape.EdgeSingular[]) => {
    if (!activePage) return;
    const lineIds = targets
      .filter((target) => target.data("lineType") === "userDefined")
      .map((target) => Number(target.data("lineId")));

    if (lineIds.length === 0) return;

    dispatch(setCopiedElements({ ids: [...new Set(lineIds)], type: "line", action: "COPY", pageId: activePage.id }));
  };

  const pastePageLines = (clickPosition: Position) => {
    if (
      !copiedElements ||
      !activePage ||
      !cytoCoordMapper ||
      !diagramAreasLimits?.availableAreaLimitWithPageBlockPx ||
      !cyto
    )
      return;

    const originalPage = getPageByPageId(copiedElements.pageId ?? activePage.id);
    if (!originalPage) return;

    copiedElements?.elements
      .filter((ele): ele is LineDTO => !!ele)
      .forEach((line) => {
        const copiedLine = line;
        const coordPositions = copiedLine.coordRefs.map((coordRef) => {
          return originalPage.coordinates?.find((coord) => coord.id === coordRef)?.position;
        });

        const boundingBox = {
          x1: Math.min(...coordPositions.map((p) => p?.x ?? 0)),
          x2: Math.max(...coordPositions.map((p) => p?.x ?? 0)),
          y1: -Math.min(...coordPositions.map((p) => Math.abs(p?.y ?? 0))),
          y2: -Math.max(...coordPositions.map((p) => Math.abs(p?.y ?? 0))),
        };

        // Calculate the center of the bounding box of the copied line
        const center = {
          x: (boundingBox.x1 + boundingBox.x2) / 2,
          y: (boundingBox.y1 + boundingBox.y2) / 2,
        };

        const cyClickPosition = cytoCoordMapper.cytoscapeToPlanCoord(clickPosition);
        const movedDistance = { deltaX: cyClickPosition.x - center.x, deltaY: cyClickPosition.y - center.y };

        const convertedAvailableAreasLimitsTopLeft = cytoCoordMapper.cytoscapeToPlanCoord({
          x: diagramAreasLimits.diagramOuterLimitsPx.x1,
          y: diagramAreasLimits.diagramOuterLimitsPx.y1,
        });

        const convertedAvailableAreasLimitsRightBottom = cytoCoordMapper.cytoscapeToPlanCoord({
          x: diagramAreasLimits.diagramOuterLimitsPx.x2,
          y: diagramAreasLimits.diagramOuterLimitsPx.y2,
        });

        // Check if the line pasted position is within the available area limits
        if (boundingBox.x1 + movedDistance.deltaX < convertedAvailableAreasLimitsTopLeft.x) {
          const leftMost = convertedAvailableAreasLimitsTopLeft.x;
          movedDistance.deltaX = leftMost - boundingBox.x1;
        } else if (boundingBox.x2 + movedDistance.deltaX > convertedAvailableAreasLimitsRightBottom.x) {
          const rightMost = convertedAvailableAreasLimitsRightBottom.x;
          movedDistance.deltaX = rightMost - boundingBox.x2;
        } else {
          movedDistance.deltaX = cyClickPosition.x - center.x;
        }

        if (Math.abs(boundingBox.y1 + movedDistance.deltaY) < Math.abs(convertedAvailableAreasLimitsTopLeft.y)) {
          const topMost = convertedAvailableAreasLimitsTopLeft.y;
          movedDistance.deltaY = topMost - boundingBox.y1;
        } else if (
          Math.abs(boundingBox.y2 + movedDistance.deltaY) > Math.abs(convertedAvailableAreasLimitsRightBottom.y)
        ) {
          const bottomMost = convertedAvailableAreasLimitsRightBottom.y;
          movedDistance.deltaY = bottomMost - boundingBox.y2;
        } else {
          movedDistance.deltaY = cyClickPosition.y - center.y;
        }

        const cyMaxId = getCyMaxId();
        const coordNodeList: cytoscape.NodeDefinition[] = copiedLine.coordRefs.map((coordRef, index) => {
          const coord = originalPage.coordinates?.find((coord) => coord.id === coordRef);
          return {
            group: "nodes",
            data: { id: `${cyMaxId + index + 1}` },
            position: cytoCoordMapper.planCoordToCytoscape({
              x: (coord?.position.x ?? 0) + movedDistance.deltaX,
              y: (coord?.position.y ?? 0) + movedDistance.deltaY,
            }),
          } as cytoscape.NodeDefinition;
        });

        let newMaxIdAfterAddingCoords = cyMaxId + copiedLine.coordRefs.length + 1;
        dispatch(
          replacePage({
            updatedPage: addPageLineByCoordList(
              activePage,
              coordNodeList,
              cytoCoordMapper,
              newMaxIdAfterAddingCoords++,
              copiedLine,
            ),
          }),
        );
      });

    if (copiedElements.action === "CUT") {
      dispatch(removePageLines({ lineIds: copiedElements.elements.map((line) => `${line.id}`) }));
    }
  };

  return {
    deletePageLines,
    cutPageLines,
    copyPageLines,
    pastePageLines,
  };
};
