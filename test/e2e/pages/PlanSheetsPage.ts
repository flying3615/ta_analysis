import { Locator, Page } from "playwright-core";

import { CytoscapeData, CytoscapeElement } from "../types";

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
    const cyCanvasId = this.canvasTestId;
    const cyData = await this.page.evaluate(() => {
      /* eslint-disable-next-line */
      const cyData = (window as any).cytoscapeData;
      // eslint-disable-next-line
      return cyData as Record<string, string>;
    });
    if (!cyData.hasOwnProperty(cyCanvasId)) {
      throw new Error(`${cyCanvasId} not found in window object`);
    }

    this.cytoscapeData = JSON.parse(cyData[cyCanvasId]) as CytoscapeData;
    return this;
  }

  public getCytoscapeData(): CytoscapeData {
    return this.cytoscapeData;
  }

  public getCytoscapeNodeById(id: string | number): CytoscapeElement {
    if (!this.cytoscapeData) {
      throw new Error(`Must call fetchCytoscapeData() before getCytoscapeNode()`);
    }
    const node = this.cytoscapeData.elements.nodes.find((element) => element.data.id === id.toString());
    if (!node) {
      throw new Error(`Cytoscape node with id ${id} not found`);
    }
    return node;
  }

  public getCytoscapeNodeByLabel(label: string): CytoscapeElement {
    if (!this.cytoscapeData) {
      throw new Error(`Must call fetchCytoscapeData() before getCytoscapeNode()`);
    }
    const node = this.cytoscapeData.elements.nodes.find((element) => element.data.label === label);
    if (!node) {
      throw new Error(`Cytoscape node with label ${label} not found`);
    }
    // console.log(`Found label node ${JSON.stringify(label)}`);
    return node;
  }

  public getCytoscapeCanvas(): Locator {
    return this.page.locator(`[data-testid='${this.canvasTestId}'] canvas`).first();
  }
}
