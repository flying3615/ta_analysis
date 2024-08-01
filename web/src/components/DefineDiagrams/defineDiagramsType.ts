export type DefineDiagramsActionType =
  | "idle"
  | "enlarge_diagram_rectangle"
  | "enlarge_diagram_polygon"
  | "define_primary_diagram_rectangle"
  | "define_primary_diagram_polygon"
  | "define_nonprimary_diagram_rectangle"
  | "define_nonprimary_diagram_polygon"
  | "define_survey_diagram_rectangle"
  | "define_survey_diagram_polygon";

export enum DefineDiagramMenuLabels {
  Delete = "Delete",
  ZoomIn = "Zoom in",
  ZoomOut = "Zoom out",
  ZoomCentre = "Zoom centre",
  SelectRTLines = "Select RT lines",
  AddRTLines = "Add RT lines",
  DrawRTBoundary = "Draw RT boundary",
  DrawAbuttal = "Draw abuttal",
  SelectLine = "Select line",
  SelectDiagram = "Select diagram",
  LabelDiagrams = "Label diagrams",
  EnlargeDiagram = "Enlarge diagram",
  EnlargeByRectangle = "Enlarge by rectangle",
  EnlargeByPolygon = "Enlarge by polygon",
  ReduceDiagram = "Reduce diagram",
  ReduceByRectangle = "Reduce by rectangle",
  ReduceByPolygon = "Reduce by polygon",
  ManageLabels = "Manage labels",
}
