export enum PlanElementType {
  LABELS = "labels",
  LINE_LABELS = "lineLabels",
  PARCEL_LABELS = "parcelLabels",
  CHILD_DIAGRAM_LABELS = "childDiagrams",
  COORDINATE_LABELS = "coordinateLabels",
  COORDINATES = "coordinates",
  LINES = "lines",
  DIAGRAM = "diagram",
}

export enum PlanElementSelector {
  DiagramNode = `node[elementType='${PlanElementType.DIAGRAM}']`,
  Labels = `node[elementType='${PlanElementType.LABELS}']`,
}
