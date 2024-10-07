import { DisplayStateEnum, LabelDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";

import { LabelRotationMenuItem } from "@/components/CytoscapeCanvas/ContextMenuItems/LabelRotationMenuItem.tsx";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import { LookupSourceResult } from "@/modules/plan/LookupGraphData.ts";

const getProperties = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
  const { target } = event;
  if (target) {
    const selectedId = target.id();
    console.log("Selected ID:", selectedId);
    // Todo get properties
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
  lookupGraphData: {
    lookupSource: (planElementType: PlanElementType, idString: string) => LookupSourceResult | undefined;
    findMarkSymbol: (fromFeature: LookupSourceResult | undefined) => LabelDTO | undefined;
  },
  planMode: PlanMode,
  element: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core,
  planElementType: PlanElementType,
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

  const buildLabelMenus = (targetLabel: NodeSingular): MenuItem[] => {
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
      {
        title: "Rotate label",
        submenu: [{ title: <LabelRotationMenuItem targetLabel={targetLabel} /> }],
      },
      { title: "Move to page...", callback: movetoPage },
      { title: "Cut", divider: true },
      { title: "Copy" },
      { title: "Paste" },
      { title: "Delete", className: "delete-item" },
    ];
  };

  const nodeMenus: MenuItem[] = [
    { title: "Original location", callback: getProperties },
    {
      title: "Show",
      hideWhen: (e) =>
        [ShowHideMenuOptionState.HIDE, ShowHideMenuOptionState.HIDE_DISABLED].includes(getNodeShowState(e)),
      disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.SHOW_DISABLED,
    },
    {
      title: "Hide",
      hideWhen: (e) =>
        [ShowHideMenuOptionState.SHOW, ShowHideMenuOptionState.SHOW_DISABLED].includes(getNodeShowState(e)),
      disableWhen: (e) => getNodeShowState(e) === ShowHideMenuOptionState.HIDE_DISABLED,
    },
    // { title: "Properties", callback: getProperties },
    // { title: "Cut", disabled: true },
    // { title: "Copy", disabled: true },
    // { title: "Paste", disabled: true },
  ];

  if (lookupGraphData === undefined) return undefined;
  switch (planMode) {
    case PlanMode.SelectDiagram:
      if (element.data("id") == null) return undefined;
      return diagramMenus;
    case PlanMode.SelectLine:
      if (planElementType !== PlanElementType.LINES) return undefined;
      return lineMenus;
    case PlanMode.SelectCoordinates:
      if (planElementType !== PlanElementType.COORDINATES) return undefined;
      return nodeMenus;
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
      return buildLabelMenus(element as NodeSingular);
    default:
      return undefined;
  }
}

export const getMenuItemsForPlanElement = (
  lookupSelectors: {
    lookupSource: (planElementType: PlanElementType, idString: string) => LookupSourceResult | undefined;
    findMarkSymbol: (fromFeature: LookupSourceResult | undefined) => LabelDTO | undefined;
  },
  planMode: PlanMode,
  element: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core,
): MenuItem[] | undefined => {
  const planElementType = element.data("elementType") as PlanElementType;

  return getAllMenuItemsForElement(lookupSelectors, planMode, element, planElementType)
    ?.map((menuItem) => ({
      ...menuItem,
      disabled: menuItem.disabled || menuItem.disableWhen?.(element),
    }))
    .filter((menuItem) => {
      return !menuItem.hideWhen?.(element);
    });
};
