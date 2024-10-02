import { DisplayStateEnum, LabelDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";

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
  elementId: string,
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
    { title: "Move To Page...", callback: movetoPage },
  ];

  const lineShouldBeDisplayed = (element: NodeSingular | EdgeSingular | cytoscape.Core) => {
    return (
      element.data("displayState") === DisplayStateEnum.display ||
      element?.data("displayState") === DisplayStateEnum.systemDisplay
    );
  };

  const lineMenus: MenuItem[] = [
    { title: "Original Location", callback: getProperties },
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
    { title: "Cut", disabled: true },
    { title: "Copy", disabled: true },
    { title: "Paste", disabled: true },
    {
      title: "Select",
      submenu: [
        { title: "Observation Distance", callback: getProperties },
        { title: "All", callback: getProperties },
      ],
    },
  ];

  const symbolShouldBeDisplayed = (element: NodeSingular | EdgeSingular | cytoscape.Core) => {
    const markSymbol = lookupGraphData.findMarkSymbol(lookupElementSource(element as NodeSingular | EdgeSingular));
    console.log(`Element ${element.data("id")} displayState of markSymbol: ${markSymbol?.displayState}`);

    return (
      markSymbol?.displayState === DisplayStateEnum.display ||
      markSymbol?.displayState === DisplayStateEnum.systemDisplay
    );
  };

  const nodeMenus: MenuItem[] = [
    { title: "Original Location", callback: getProperties },
    {
      title: "Show",
      hideWhen: symbolShouldBeDisplayed,
    },
    { title: "Hide", hideWhen: (element) => !symbolShouldBeDisplayed(element) },
    { title: "Properties", callback: getProperties },
    { title: "Cut", disabled: true },
    { title: "Copy", disabled: true },
    { title: "Paste", disabled: true },
  ];

  const labelMenus: MenuItem[] = [
    { title: "Original Location", callback: getProperties },
    {
      title: "Show",
      hideWhen: symbolShouldBeDisplayed,
    },
    { title: "Hide", hideWhen: (element) => !symbolShouldBeDisplayed(element) },
    { title: "Properties", callback: getProperties },
    { title: "Cut", disabled: true },
    { title: "Copy", disabled: true },
    { title: "Paste", disabled: true },
  ];

  if (lookupGraphData === undefined) return undefined;
  switch (planMode) {
    case PlanMode.SelectDiagram:
      if (elementId == null) return undefined;
      return diagramMenus;
    case PlanMode.SelectLine:
      if (planElementType !== PlanElementType.LINES) return undefined;
      return lineMenus;
    case PlanMode.SelectCoordinates:
      if (planElementType !== PlanElementType.COORDINATES) return undefined;
      return nodeMenus;
    case PlanMode.SelectLabel:
      //There are labels, lineLabels, parcelLabel, childDiagramLabels
      //this catches them all but might need to revisit if different label types have different menus
      if (!planElementType.toLowerCase().endsWith(PlanElementType.LABELS)) return undefined;
      return labelMenus;
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
  const elementId = element.data("id");

  return getAllMenuItemsForElement(lookupSelectors, planMode, elementId, planElementType)
    ?.map((menuItem) => ({
      ...menuItem,
      disabled: menuItem.disabled || menuItem.disableWhen?.(element),
    }))
    .filter((menuItem) => {
      return !menuItem.hideWhen?.(element);
    });
};
