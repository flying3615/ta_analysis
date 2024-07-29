import { Page } from "@playwright/test";

interface CytoscapeData {
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

export const getCytoscapeData = async (
  page: Page,
  baseURL: string,
  canvasTestId: string = "MainCytoscapeCanvas",
): Promise<CytoscapeData> => {
  const { localStorage } = (await page.context().storageState()).origins.find(({ origin }) => origin === baseURL);
  const cytoscapeJson = localStorage.find(({ name }) => name === `${canvasTestId}-cytoscapeData`);
  if (!cytoscapeJson) {
    throw new Error(`${canvasTestId}-cytoscapeData not found in localStorage`);
  }
  return JSON.parse(cytoscapeJson.value) as CytoscapeData;
};

export const getCytoscapeNode = (id: string | number, data: CytoscapeData): CytoscapeElement => {
  const node = data.elements.nodes.find((element) => element.data.id === id.toString());
  if (!node) {
    throw new Error(`Cytoscape node with id ${id} not found`);
  }
  return node;
};
