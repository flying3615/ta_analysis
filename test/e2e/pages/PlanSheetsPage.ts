import { Locator, Page } from "playwright-core";

export class PlanSheetsPage {
  private readonly page: Page;
  private readonly baseURL: string;
  private readonly canvasTestId: string;

  private cytoscapeData: CytoscapeData;

  constructor(page: Page, baseURL: string, canvasTestId: string = "MainCytoscapeCanvas") {
    this.page = page;
    this.baseURL = baseURL;
    this.canvasTestId = canvasTestId;
  }

  public async fetchCytoscapeData(): Promise<this> {
    const { localStorage } = (await this.page.context().storageState()).origins.find(
      ({ origin }) => origin === this.baseURL,
    );
    const cytoscapeJson = localStorage.find(({ name }) => name === `${this.canvasTestId}-cytoscapeData`);
    if (!cytoscapeJson) {
      throw new Error(`${this.canvasTestId}-cytoscapeData not found in localStorage`);
    }
    this.cytoscapeData = JSON.parse(cytoscapeJson.value) as CytoscapeData;
    return this;
  }

  public getCytoscapeData(): CytoscapeData {
    return this.cytoscapeData;
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

  public getCytoscapeCanvas(): Locator {
    return this.page.locator(`[data-testid='${this.canvasTestId}'] canvas`).first();
  }
}
