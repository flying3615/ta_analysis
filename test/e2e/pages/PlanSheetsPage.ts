import { Page } from "playwright-core";

export class PlanSheetsPage {
  private readonly page: Page;
  private readonly baseURL: string;

  private cytoscapeData: CytoscapeData;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  public async fetchCytoscapeData(canvasTestId: string = "MainCytoscapeCanvas"): Promise<this> {
    const { localStorage } = (await this.page.context().storageState()).origins.find(
      ({ origin }) => origin === this.baseURL,
    );
    const cytoscapeJson = localStorage.find(({ name }) => name === `${canvasTestId}-cytoscapeData`);
    if (!cytoscapeJson) {
      throw new Error(`${canvasTestId}-cytoscapeData not found in localStorage`);
    }
    this.cytoscapeData = JSON.parse(cytoscapeJson.value) as CytoscapeData;
    return this;
  }

  public getCytoscapeNode(id: string | number): CytoscapeElement {
    if (!this.cytoscapeData) {
      throw new Error(`Must call fetchCytoscapeData() before getCytoscapeNode()`);
    }
    const node = this.cytoscapeData.elements.nodes.find((element) => element.data.id === id.toString());
    if (!node) {
      throw new Error(`Cytoscape node with id ${id} not found`);
    }
    return node;
  }
}
