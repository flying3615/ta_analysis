export type DefineDiagramsActionType =
  | "idle"
  | "enlarge_diagram_rectangle"
  | "enlarge_diagram_polygon"
  | "reduce_diagram_rectangle"
  | "reduce_diagram_polygon"
  | "select_rt_line"
  | "define_primary_diagram_rectangle"
  | "define_primary_diagram_polygon"
  | "define_nonprimary_diagram_rectangle"
  | "define_nonprimary_diagram_polygon"
  | "define_survey_diagram_rectangle"
  | "define_survey_diagram_polygon"
  | "manage_labels_view_labels"
  | "manage_labels_dynamically_generate_list";

export enum DefineDiagramMenuLabels {
  Delete = "Delete",
  ZoomIn = "Zoom in",
  ZoomOut = "Zoom out",
  ZoomCentre = "Zoom centre",
  AddRTLines = "Add RT lines",
  DrawRTBoundary = "Draw RT boundary",
  DrawAbuttal = "Draw abuttal",
  SelectLine = "Select line",
  SelectDiagram = "Select diagram",
  LabelDiagrams = "Label diagrams",
}
