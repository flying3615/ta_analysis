import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { PanelsContext } from "@linzjs/windows";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";
import { useContext, useRef } from "react";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem";
import { IGraphDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import PlanElementProperty, { PlanPropertyPayload } from "@/components/PlanSheets/PlanElementProperty";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode, PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType";
import { LabelPropertiesData } from "@/components/PlanSheets/properties/LabelProperties";
import { increaseZIndex, restoreZIndex } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { LinePropertiesData } from "@/components/PlanSheets/properties/LineProperties";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useChangeLine } from "@/hooks/useChangeLine";
import { useChangeNode } from "@/hooks/useChangeNode";
import { useMoveOriginalLocation } from "@/hooks/useMoveOriginalLocation";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { selectLookupGraphData } from "@/modules/plan/selectGraphData";
import { getPlanMode, getPreviousAttributesForDiagram, setDiagramIdToMove } from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

import { useLabelsFunctions } from "./useLabelsFunctions";
import { usePageLabelEdit } from "./usePageLabelEdit";
import { usePageLineEdit } from "./usePageLineEdit";

export const usePlanSheetsContextMenu = () => {
  const dispatch = useAppDispatch();
  const findPreviousAttributesForDiagram = useAppSelector(getPreviousAttributesForDiagram);
  const lookupGraphData = useAppSelector(selectLookupGraphData);
  const planMode = useAppSelector(getPlanMode);
  const { openPanel } = useContext(PanelsContext);
  const setNodeHidden = useChangeNode();
  const setLineHidden = useChangeLine();
  const { deletePageLines, cutPageLines, copyPageLines } = usePageLineEdit();
  const { deletePageLabels, copyPageLabels, cutPageLabels } = usePageLabelEdit();
  const {
    setOriginalLocation,
    filterNonSystemLabels,
    updateLabelsDisplayState,
    alignLabelToLine,
    isLabel,
    getStackedLabels,
  } = useLabelsFunctions();
  const highlightedLabel = useRef<NodeSingular>();
  const { restoreOriginalPosition } = useMoveOriginalLocation();

  const buildDiagramMenu = (previousDiagramAttributes?: PreviousDiagramAttributes): MenuItem[] => {
    const baseDiagramMenu: MenuItem[] = [{ title: "Move to page", callback: moveDiagramToPage }];
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
      PlanElementType.COORDINATES,
      PlanElementType.COORDINATE_LABELS,
      PlanElementType.CHILD_DIAGRAM_LABELS,
      PlanElementType.PARCEL_LABELS,
    ];
    const data = target?.data() as IGraphDataProperties;
    if (data.elementType && position && elementTypes.includes(data.elementType)) {
      let planProperty: PlanPropertyPayload;
      if (planMode === PlanMode.SelectLine) {
        if (data.elementType === PlanElementType.LINES) {
          // If the data element is a line then we can just grab the LineProperties from that
          planProperty = {
            mode: PlanMode.SelectLine,
            data: cy.$("edge:selected").map((edge) => edge.data() as LinePropertiesData),
            position: { ...position },
          };
        } else if (data.elementType === PlanElementType.COORDINATES) {
          // If the data element is a coordinate then we need to find the connected edges and grab the LineProperties from those
          const node = target as NodeSingular;
          const connectedEdges = node.connectedEdges();
          if (connectedEdges.length > 0) {
            planProperty = {
              mode: PlanMode.SelectLine,
              data: connectedEdges.map((edge) => edge.data() as LinePropertiesData),
              position: { ...position },
            };
          } else {
            console.error("No connected edges found for coordinate");
          }
        } else {
          throw new Error("Invalid plan mode");
        }
      } else if (planMode === PlanMode.SelectLabel) {
        planProperty = {
          mode: PlanMode.SelectLabel,
          data: cy.$("node:selected").map((node) => node.data() as LabelPropertiesData),
          position: { ...position },
        };
      } else {
        throw new Error("Invalid plan mode");
      }
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
      const selectedEdges = selectedCollection?.edges();
      if (!selectedEdges) return [];
      const selectedLineNumber = cytoscapeUtils.countLines(selectedEdges);

      return [
        {
          title: "Original location",
          disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
            element.data("diagramId") === undefined,
          callback: () => restoreOriginalPosition(targetLine),
        },
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
          title: "Cut",
          divider: true,
          disableWhen: () =>
            selectedEdges.some((ele) => ele.data("lineType") !== "userDefined") || selectedLineNumber !== 1,
          callback: () => cutPageLines([...selectedEdges]),
        },
        {
          title: "Copy",
          disableWhen: () =>
            selectedEdges.some((ele) => ele.data("lineType") !== "userDefined") || selectedLineNumber !== 1,
          callback: () => copyPageLines([...selectedEdges]),
        },
        { title: "Paste", disabled: true },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () => selectedCollection?.edges().some((ele) => ele.data("lineType") !== "userDefined") ?? true,
          callback: () => {
            deletePageLines([...(selectedCollection?.edges() ?? [])]);
          },
        },
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
      targetLabel.removeClass(PlanStyleClassName.ElementHover);
      const singleSelected = selectedCollection && selectedCollection?.size() === 1;
      const selectedLabels = selectedCollection?.nodes();
      if (!selectedLabels) return [];
      const selectedNonSystemLabels = filterNonSystemLabels(selectedLabels);
      const stackedLabels = getStackedLabels(targetLabel, clickedPosition);

      return [
        { title: "Original location", callback: () => setOriginalLocation(selectedLabels) },
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
              selectedLabels.unselect();
              stackedLabels.forEach((elem) => restoreZIndex(elem));
              // highlight selected label and bring it to the front of the stack
              highlightedLabel.current = label;
              highlightedLabel.current.select();
              increaseZIndex(highlightedLabel.current);
            },
            callbackOnHover: true,
            restoreOnLeave: () => {
              highlightedLabel.current?.unselect();
              selectedLabels.select();
              stackedLabels.forEach((elem) => restoreZIndex(elem));
              selectedLabels.forEach((elem) => increaseZIndex(elem));
            },
          })),
        },
        // Add the "Rotate label" menu item only if singleSelected is true
        ...(singleSelected ? [{ title: "Align label to line", callback: alignLabelToLine }] : []),
        ...(singleSelected
          ? [{ title: "Rotate label", submenu: [{ title: <LabelRotationMenuItem targetLabel={targetLabel} /> }] }]
          : []),
        {
          title: "Cut",
          divider: true,
          disableWhen: () =>
            selectedLabels.some((ele) => ele.data("labelType") !== LabelDTOLabelTypeEnum.userAnnotation),
          callback: () => cutPageLabels([...selectedLabels]),
        },
        {
          title: "Copy",
          disableWhen: () =>
            selectedLabels.some((ele) => ele.data("labelType") !== LabelDTOLabelTypeEnum.userAnnotation),
          callback: () => copyPageLabels([...selectedLabels]),
        },
        {
          title: "Paste",
          disabled: true,
        },
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
        { title: "Original location", callback: () => restoreOriginalPosition(targetNode) },
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
        if (!(planElementType === PlanElementType.COORDINATES || planElementType === PlanElementType.LINES))
          return undefined;
        return buildLineMenus(element as EdgeSingular, selectedCollection);
      case PlanMode.SelectCoordinates:
        if (!(planElementType === PlanElementType.COORDINATES || planElementType === PlanElementType.COORDINATE_LABELS))
          return undefined;
        return buildNodeMenus(element as NodeSingular);
      case PlanMode.SelectLabel:
        if (!isLabel(planElementType)) return undefined;
        return buildLabelMenus(element as NodeSingular, selectedCollection);
      default:
        return undefined;
    }
  };

  const moveDiagramToPage = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    const diagramId = event.target?.data("diagramId") as number;
    if (!diagramId) {
      return;
    }
    dispatch(setDiagramIdToMove(diagramId));
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
