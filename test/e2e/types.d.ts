export interface CytoscapeData {
  elements: {
    nodes: CytoscapeElement[];
    edges: CytoscapeElement[];
  };
  pan: {
    x: number;
    y: number;
  };
  zoom: number;
}

interface CytoscapeElement {
  data: {
    id: string;
    label: string;
  };
  position: {
    x: number;
    y: number;
  };
  group: "nodes" | "edges";
  removed: boolean;
  selected: boolean;
  selectable: boolean;
  locked: boolean;
  grabbable: boolean;
  pannable: boolean;
  classes: string;
}
