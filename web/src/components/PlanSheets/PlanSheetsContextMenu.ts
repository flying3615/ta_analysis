import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";

const getProperties = (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => {
  const { target } = event;
  if (target) {
    const selectedId = target.id();
    console.log("Selected ID:", selectedId);
    // Todo get properties
    console.log(lineMenus);
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

const diagramMenus: MenuItem[] = [
  { title: "Properties", callback: getProperties },
  { title: "Move To Page...", divider: true, callback: movetoPage },
];
const lineMenus: MenuItem[] = [
  { title: "Original Location", callback: getProperties },
  { title: "Properties", callback: getProperties },
  {
    title: "Select",
    divider: true,
    submenu: [
      { title: "Observation Distance", callback: getProperties },
      { title: "All", callback: getProperties },
    ],
  },
];
const nodeMenus: MenuItem[] = [
  { title: "Original Location", callback: getProperties },
  { title: "Show", disabled: true },
  { title: "Properties", callback: getProperties },
];

export const getMenuItemsForPlanMode = (
  planMode: PlanMode | undefined,
  element: NodeSingular | EdgeSingular | cytoscape.Core,
): MenuItem[] | undefined => {
  const planElementType = element.data("elementType") as PlanElementType;
  const elementId = element.data("id");

  if (!planElementType) return;

  console.log(`getMenuItemsForPlanMode: ${planMode} ${planElementType}, ${elementId}`);
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
    default:
      return undefined;
  }
};
