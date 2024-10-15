import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem.tsx";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { PlanElementData, PlanElementPropertyMode } from "@/components/PlanSheets/PlanElementProperty.tsx";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useChangeNode } from "@/hooks/useChangeNode.ts";
import { selectLookupGraphData } from "@/modules/plan/selectGraphData";
import { getPlanMode, setPlanProperty } from "@/redux/planSheets/planSheetsSlice.ts";

export const usePlanSheetsContextMenu = () => {
  const planMode = useAppSelector(getPlanMode);
  const setNodeHidden = useChangeNode();
  const lookupGraphData = useAppSelector(selectLookupGraphData);
  const dispatch = useAppDispatch();

  const getProperties = (event: {
    target: NodeSingular | EdgeSingular | null;
    cy: cytoscape.Core | undefined;
    position?: cytoscape.Position;
  }) => {
    const { target, position } = event;
    const elementTypes = [PlanElementType.LINES, PlanElementType.LABELS, PlanElementType.LINE_LABELS];
    if (target && position && elementTypes.includes(target.data().elementType)) {
      dispatch(
        setPlanProperty({
          mode: planMode as PlanElementPropertyMode,
          data: target.data() as PlanElementData,
          position: position,
        }),
      );
    }
  };

  const movetoPage = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
    const { cy } = event;
    if (cy) {
      const selectedNodes = cy.$("node:selected");
      if (selectedNodes.length > 0) {
        const selectedNodeIds = selectedNodes.map((node) => node.data("id"));
        const parentNode = cy.getElementById(selectedNodeIds[0]);
        if (parentNode.length > 0) {
          const childNodes = parentNode.children();
          childNodes.forEach((child) => {
            console.log("Child Node ID:", child.id());
          });
          // Todo move to a page
        }
      } else {
        console.log("No nodes selected");
      }
    }
  };

  function getAllMenuItemsForElement(
    element: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core,
    planElementType: PlanElementType,
    selectedCollection?: CollectionReturnValue,
  ) {
    const lookupElementSource = (element: NodeSingular | EdgeSingular) => {
      return lookupGraphData.lookupSource(element.data("elementType") as PlanElementType, element.data("id"));
    };

    const diagramMenus: MenuItem[] = [
      { title: "Properties", callback: getProperties },
      { title: "Cut", disabled: true },
      { title: "Copy", disabled: true },
      { title: "Paste", disabled: true },
      { title: "Move to page...", callback: movetoPage },
    ];

    const lineShouldBeDisplayed = (element: NodeSingular | EdgeSingular | cytoscape.Core) => {
      return (
        element.data("displayState") === DisplayStateEnum.display ||
        element?.data("displayState") === DisplayStateEnum.systemDisplay
      );
    };

    const lineMenus: MenuItem[] = [
      { title: "Original location", callback: getProperties },
      {
        title: "Show",
        disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
          element.data("displayState") === DisplayStateEnum.systemHide,
        hideWhen: lineShouldBeDisplayed,
      },
      {
        title: "Hide",
        disableWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) =>
          element.data("displayState") === DisplayStateEnum.systemDisplay,
        hideWhen: (element: NodeSingular | EdgeSingular | cytoscape.Core) => !lineShouldBeDisplayed(element),
      },
      { title: "Properties", callback: getProperties },
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
      return [
        { title: "Original location", callback: getProperties },
        { title: "Show", hideWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.HIDE },
        { title: "Properties", callback: getProperties },
        {
          title: "Select",
          divider: true,
          submenu: [
            { title: "Observation distance" },
            { title: "Observation bearing" },
            { title: "Observation code" },
            { title: "All" },
          ],
        },
        // Add the "Rotate label" menu item only if singleSelected is true
        ...(singleSelected
          ? [{ title: "Rotate label", submenu: [{ title: <LabelRotationMenuItem targetLabel={targetLabel} /> }] }]
          : []),
        { title: "Move to page...", callback: movetoPage },
        { title: "Cut", divider: true, disabled: true },
        { title: "Copy", disabled: true },
        { title: "Paste", disabled: true },
        {
          title: "Delete",
          className: "delete-item",
          disableWhen: () =>
            selectedCollection?.nodes().some((ele) => ele.data("labelType") !== LabelDTOLabelTypeEnum.userAnnotation) ??
            true,
        },
        ...(singleSelected ? [{ title: "Align label to line" }] : []),
      ];
    };

    const nodeMenus: MenuItem[] = [
      { title: "Original location", callback: getProperties },
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

    switch (planMode) {
      case PlanMode.SelectDiagram:
        if (element.data("id") == null) return undefined;
        return diagramMenus;
      case PlanMode.SelectLine:
        if (planElementType !== PlanElementType.LINES) return undefined;
        return lineMenus;
      case PlanMode.SelectCoordinates:
        if (planElementType === PlanElementType.COORDINATES || planElementType === PlanElementType.COORDINATE_LABELS)
          return nodeMenus;
        return undefined;
      case PlanMode.SelectLabel:
        if (
          ![
            PlanElementType.LABELS,
            PlanElementType.PARCEL_LABELS,
            PlanElementType.LINE_LABELS,
            PlanElementType.COORDINATE_LABELS,
            PlanElementType.CHILD_DIAGRAM_LABELS,
          ].includes(planElementType)
        )
          return undefined;
        return buildLabelMenus(element as NodeSingular, selectedCollection);
      default:
        return undefined;
    }
  }

  return (
    clickedElement: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core | undefined,
    selectedCollection?: CollectionReturnValue,
  ): MenuItem[] => {
    const element = clickedElement ?? selectedCollection?.nodes()[0] ?? selectedCollection?.edges()[0] ?? undefined;
    if (!element) return [];
    const planElementType = element.data("elementType") as PlanElementType;

    return (
      getAllMenuItemsForElement(element, planElementType, selectedCollection)
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
