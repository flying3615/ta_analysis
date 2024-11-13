import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { PanelsContext } from "@linzjs/windows";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { degreesToRadians, point, polygon } from "@turf/helpers";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";
import { useContext, useRef } from "react";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { IGraphDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { textDimensions } from "@/components/CytoscapeCanvas/styleNodeMethods";
import { MoveOriginalLocation } from "@/components/PlanSheets/interactions/MoveOriginalLocation";
import PlanElementProperty, { PlanPropertyPayload } from "@/components/PlanSheets/PlanElementProperty";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  LabelPropertiesData,
  LabelPropsToUpdate,
  LabelPropsToUpdateWithElemType,
} from "@/components/PlanSheets/properties/LabelProperties";
import { cytoscapeLabelIdToPlanData } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { LinePropertiesData } from "@/components/PlanSheets/properties/LineProperties";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useChangeLine } from "@/hooks/useChangeLine";
import { useChangeNode } from "@/hooks/useChangeNode";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { selectActiveDiagrams, selectLookupGraphData } from "@/modules/plan/selectGraphData";
import { updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import {
  getActivePage,
  getPlanMode,
  getPreviousAttributesForDiagram,
  replaceDiagrams,
  replacePage,
  setAlignedLabelNodeId,
  setDiagramIdToMove,
  setPlanMode,
} from "@/redux/planSheets/planSheetsSlice";

import { usePageLabelEdit } from "./usePageLabelEdit";
import { usePageLineEdit } from "./usePageLineEdit";

export const usePlanSheetsContextMenu = () => {
  const dispatch = useAppDispatch();
  const findPreviousAttributesForDiagram = useAppSelector(getPreviousAttributesForDiagram);
  const lookupGraphData = useAppSelector(selectLookupGraphData);
  const planMode = useAppSelector(getPlanMode);
  const activePage = useAppSelector(getActivePage);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const { openPanel } = useContext(PanelsContext);
  const setNodeHidden = useChangeNode();
  const setLineHidden = useChangeLine();
  const { deletePageLines } = usePageLineEdit();
  const { deletePageLabels } = usePageLabelEdit();
  const highlightedLabel = useRef<NodeSingular>();

  const buildDiagramMenu = (previousDiagramAttributes?: PreviousDiagramAttributes): MenuItem[] => {
    const baseDiagramMenu: MenuItem[] = [{ title: "Move to page", callback: movetoPage }];
    if (!previousDiagramAttributes) {
      return baseDiagramMenu;
    }
    if (previousDiagramAttributes?.linesAffectedByLastMove?.length > 0) {
      baseDiagramMenu.push({ title: "Select lines affected by last diagram shift", disabled: true });
    }
    if (previousDiagramAttributes?.labelsAffectedByLastMove?.length > 0) {
      baseDiagramMenu.push({ title: "Select text affected by last diagram shift", disabled: true });
    }
    return baseDiagramMenu;
  };

  const getProperties = (event: {
    target: NodeSingular | EdgeSingular | null;
    cy: cytoscape.Core | undefined;
    position?: cytoscape.Position;
  }) => {
    const { target, position, cy } = event;
    if (!cy) return;
    const elementTypes = [
      PlanElementType.LINES,
      PlanElementType.LINE_LABELS,
      PlanElementType.LABELS,
      PlanElementType.COORDINATE_LABELS,
      PlanElementType.CHILD_DIAGRAM_LABELS,
      PlanElementType.PARCEL_LABELS,
    ];
    const data = target?.data() as IGraphDataProperties;
    if (data.elementType && position && elementTypes.includes(data.elementType)) {
      const planProperty: PlanPropertyPayload =
        planMode === PlanMode.SelectLine
          ? {
              mode: PlanMode.SelectLine,
              data: cy.$("edge:selected").map((edge) => edge.data() as LinePropertiesData),
              position: { ...position },
            }
          : {
              mode: PlanMode.SelectLabel,
              data: cy.$("node:selected").map((node) => node.data() as LabelPropertiesData),
              position: { ...position },
            };
      openPanel("Plan element property", () => <PlanElementProperty property={planProperty} />);
    }
  };

  const getAllMenuItemsForElement = (
    element: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core,
    planElementType: PlanElementType,
    clickedPosition: cytoscape.Position,
    selectedCollection?: CollectionReturnValue,
  ) => {
    const lookupElementSource = (element: NodeSingular | EdgeSingular) => {
      return lookupGraphData.lookupSource(element.data("elementType") as PlanElementType, element.data("id") as string);
    };

    const lineShouldBeDisplayed = (element: NodeSingular | EdgeSingular | cytoscape.Core) => {
      return (
        !element.data("displayState") ||
        element.data("displayState") === DisplayStateEnum.display ||
        element?.data("displayState") === DisplayStateEnum.systemDisplay
      );
    };

    const buildLineMenus = (targetLine: EdgeSingular, selectedCollection?: CollectionReturnValue): MenuItem[] => {
      return [
        { title: "Original location", callback: <MoveOriginalLocation target={targetLine} /> },
        {
          title: "Show",
          disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
            element.data("displayState") === DisplayStateEnum.systemHide,
          hideWhen: lineShouldBeDisplayed,
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setLineHidden(event.target as EdgeSingular, false);
          },
        },
        {
          title: "Hide",
          disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
            element.data("displayState") === DisplayStateEnum.systemDisplay,
          hideWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) => !lineShouldBeDisplayed(element),
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setLineHidden(event.target as EdgeSingular, true);
          },
        },
        {
          title: "Properties",
          callback: (event) => {
            if (!event.target && selectedCollection && selectedCollection[0]) {
              getProperties({
                target: selectedCollection[0],
                cy: selectedCollection[0].cy(),
                position: event.position,
              });
            } else {
              getProperties(event);
            }
          },
        },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () => selectedCollection?.edges().some((ele) => ele.data("lineType") !== "userDefined") ?? true,
          callback: () => {
            deletePageLines([...(selectedCollection?.edges() ?? [])]);
          },
        },
        // { title: "Cut", disabled: true },
        // { title: "Copy", disabled: true },
        // { title: "Paste", disabled: true },
        // {
        //   title: "Select",
        //   submenu: [
        //     { title: "Observation Distance", callback: getProperties },
        //     { title: "All", callback: getProperties },
        //   ],
        // },
      ];
    };

    // Which menu option to display for Show / Hide
    // inverse of the state of the actual object
    enum ShowHideMenuOptionState {
      SHOW,
      HIDE,
      SHOW_DISABLED,
      HIDE_DISABLED,
    }

    const getNodeShowState = (element: NodeSingular | EdgeSingular | cytoscape.Core): ShowHideMenuOptionState => {
      const markSymbol = lookupGraphData.findMarkSymbol(lookupElementSource(element as NodeSingular | EdgeSingular));

      // This covers the user defined line end node
      if (!markSymbol) return ShowHideMenuOptionState.SHOW_DISABLED;

      if (
        markSymbol?.displayState === DisplayStateEnum.display ||
        markSymbol?.displayState === DisplayStateEnum.systemDisplay
      ) {
        return ShowHideMenuOptionState.HIDE;
      }

      return ShowHideMenuOptionState.SHOW;
    };

    const buildLabelMenus = (targetLabel: NodeSingular, selectedCollection?: CollectionReturnValue): MenuItem[] => {
      const singleSelected = selectedCollection && selectedCollection?.size() === 1;
      const selectedLabels = selectedCollection?.nodes();
      if (!selectedLabels) return [];
      const selectedNonSystemLabels = filterNonSystemLabels(selectedLabels);
      const stackedLabels = getStackedLabels(targetLabel, clickedPosition);

      return [
        { title: "Original location", callback: () => <MoveOriginalLocation target={targetLabel} /> },
        {
          title: "Show",
          hideWhen: () =>
            selectedNonSystemLabels.every((ele) => ele.data("displayState") === DisplayStateEnum.display) &&
            selectedNonSystemLabels.length !== 0,
          disableWhen: () => selectedLabels.every((ele) => ele.data("displayState") === DisplayStateEnum.systemDisplay),
          callback: () => updateLabelsDisplayState(selectedLabels, "display"),
        },
        {
          title: "Hide",
          hideWhen: () =>
            selectedNonSystemLabels.some((ele) => ele.data("displayState") === DisplayStateEnum.hide) ||
            selectedNonSystemLabels.length === 0,
          disableWhen: () => selectedLabels.every((ele) => ele.data("displayState") === DisplayStateEnum.systemHide),
          callback: () => updateLabelsDisplayState(selectedLabels, "hide"),
        },
        {
          title: "Properties",
          callback: (event) => {
            if (!event.target && selectedLabels && selectedLabels[0]) {
              getProperties({
                target: selectedLabels[0],
                cy: selectedLabels[0].cy(),
                position: event.position,
              });
            } else {
              getProperties(event);
            }
          },
        },
        {
          title: "Select",
          hideWhen: () => [0, 1].includes(stackedLabels.length),
          divider: true,
          submenu: stackedLabels.map((label) => ({
            title: label.data("label") as string,
            callback: () => {
              targetLabel.unselect();
              highlightedLabel.current = label;
              highlightedLabel.current.select();
            },
            callbackOnHover: true,
            restoreOnLeave: () => {
              highlightedLabel.current?.unselect();
              targetLabel.select();
            },
          })),
        },
        // Add the "Rotate label" menu item only if singleSelected is true
        ...(singleSelected ? [{ title: "Align label to line", callback: alignLabelToLine }] : []),
        { title: "Move to page", callback: movetoPage },
        ...(singleSelected
          ? [{ title: "Rotate label", submenu: [{ title: <LabelRotationMenuItem targetLabel={targetLabel} /> }] }]
          : []),
        { title: "Cut", divider: true, disabled: true },
        { title: "Copy", disabled: true },
        { title: "Paste", disabled: true },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () =>
            selectedLabels.some((ele) => ele.data("labelType") !== LabelDTOLabelTypeEnum.userAnnotation),
          callback: () => {
            deletePageLabels([...selectedLabels]);
          },
        },
      ];
    };

    const buildNodeMenus = (targetNode: NodeSingular): MenuItem[] => {
      return [
        { title: "Original location", callback: <MoveOriginalLocation target={targetNode} /> },
        {
          title: "Show",
          hideWhen: (e) =>
            [ShowHideMenuOptionState.HIDE, ShowHideMenuOptionState.HIDE_DISABLED].includes(getNodeShowState(e)),
          disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.SHOW_DISABLED,
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setNodeHidden(event.target, false);
          },
        },
        {
          title: "Hide",
          hideWhen: (e) =>
            [ShowHideMenuOptionState.SHOW, ShowHideMenuOptionState.SHOW_DISABLED].includes(getNodeShowState(e)),
          disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.HIDE_DISABLED,
          callback: (event: { target: NodeSingular | EdgeSingular | null }) => {
            setNodeHidden(event.target, true);
          },
        },
        // { title: "Properties", callback: getProperties },
        // { title: "Cut", disabled: true },
        // { title: "Copy", disabled: true },
        // { title: "Paste", disabled: true },
      ];
    };

    switch (planMode) {
      case PlanMode.SelectDiagram:
        if (element.data("id") == null) return undefined;
        return buildDiagramMenu(findPreviousAttributesForDiagram(element.data("diagramId") as number));
      case PlanMode.SelectLine:
        if (planElementType !== PlanElementType.LINES) return undefined;
        return buildLineMenus(element as EdgeSingular, selectedCollection);
      case PlanMode.SelectCoordinates:
        if (planElementType === PlanElementType.COORDINATES || planElementType === PlanElementType.COORDINATE_LABELS)
          return buildNodeMenus(element as NodeSingular);
        return undefined;
      case PlanMode.SelectLabel:
        if (!isLabel(planElementType)) return undefined;
        return buildLabelMenus(element as NodeSingular, selectedCollection);
      default:
        return undefined;
    }
  };

  const movetoPage = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    const diagramId = event.target?.data("diagramId") as number;
    if (!diagramId) {
      return;
    }
    dispatch(setDiagramIdToMove(diagramId));
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

  const alignLabelToLine = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    if (event.target) {
      const labelNodeId = event.target.data("id") as string;
      if (!labelNodeId) return;
      dispatch(setPlanMode(PlanMode.SelectTargetLine));
      dispatch(setAlignedLabelNodeId({ nodeId: labelNodeId }));
    }
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
      // filter the labels that match the clicked position
      if (isInside) stackedLabels.push(label);
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

  return (
    clickedElement: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core | undefined,
    clickedPosition: cytoscape.Position,
    selectedCollection?: CollectionReturnValue,
  ): MenuItem[] => {
    const element = clickedElement ?? selectedCollection?.nodes()[0] ?? selectedCollection?.edges()[0] ?? undefined;
    if (!element) return [];
    const planElementType = element.data("elementType") as PlanElementType;
    return (
      getAllMenuItemsForElement(element, planElementType, clickedPosition, selectedCollection)
        ?.map((menuItem) => ({
          ...menuItem,
          disabled: menuItem.disabled || menuItem.disableWhen?.(element),
        }))
        .filter((menuItem) => {
          return !menuItem.hideWhen?.(element);
        }) ?? []
    );
  };
};
