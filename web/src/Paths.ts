export const RoutePaths = {
  root: "/plan-generation/:transactionId",
  defineDiagrams: "define-diagrams",
  layoutPlanSheets: "layout-plan-sheets",
  maintainDiagramLayers: "maintain-diagram-layers",
};

export const Paths = {
  root: RoutePaths.root,
  defineDiagrams: `${RoutePaths.root}/${RoutePaths.defineDiagrams}`,
  layoutPlanSheets: `${RoutePaths.root}/${RoutePaths.layoutPlanSheets}`,
  maintainDiagramLayers: `${RoutePaths.root}/${RoutePaths.maintainDiagramLayers}`,
};
