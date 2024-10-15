export interface PreviousDiagramAttributes {
  id: string;
  linesAffectedByLastMove: ElementImpactedByMove[];
  labelsAffectedByLastMove: ElementImpactedByMove[];
}

interface ElementImpactedByMove {
  id: string;
}
