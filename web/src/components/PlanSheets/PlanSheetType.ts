export enum PlanSheetType {
  SURVEY = "survey",
  TITLE = "title",
}

export enum PlanMode {
  Undo = "Undo",
  Delete = "Delete",
  PanMap = "Pan map",
  ZoomOut = "Zoom out tool",
  ZoomIn = "Zoom in tool",
  ZoomPrevious = "Zoom previous",
  ZoomCentre = "Zoom centre",
  ViewLabels = "View labels",
  DropdownIcon = "Dropdown icon",
  View = "View hidden objects",
  Cursor = "Cursor",
  SelectDiagram = "Select Diagrams",
  SelectLabel = "Select Labels",
  SelectCoordinates = "Select Coordinates",
  SelectLine = "Select Lines",
  SelectPolygon = "Select By Polygon (lasso)",
  AddLabel = "Add label",
  AddLine = "Add line",
  FormatLinesText = "Format lines text",
  SelectRectangle = "Select Rectangle",
  SelectTargetLine = "Select Target Line",
  NotImplemented = "Not implemented",
}

export enum PlanStyleClassName {
  DiagramNode = "diagram",
  ElementHover = "hover",

  RelatedLabelSelected = "related-label-selected",
}
