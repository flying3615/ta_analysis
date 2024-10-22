export interface PreviousDiagramAttributes {
  id: number;
  linesAffectedByLastMove: ElementImpactedByMove[];
  labelsAffectedByLastMove: ElementImpactedByMove[];
}

interface ElementImpactedByMove {
  id: string;
}
