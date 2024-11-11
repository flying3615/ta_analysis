import { Locator } from "@playwright/test";
import { Page } from "playwright-core";

export class DefineDiagramsPage {
  readonly page: Page;
  readonly definePrimaryDiagramByRectangleButton: Locator;
  readonly maintainDiagramLayersButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.definePrimaryDiagramByRectangleButton = page.getByRole("button", {
      name: "Define primary diagram (Rectangle)",
    });
    this.maintainDiagramLayersButton = page.getByRole("button", {
      name: "Maintain diagram layers",
    });
  }

  /* eslint-disable */
  public async getDiagrams(): Promise<Array<any>> {
    return await this.page.evaluate(() => {
      const map = (window as any)["map"];
      const diagramsLayer = map
        .getLayers()
        .getArray()
        .find((layer: any) => layer.getClassName() === "diagrams");
      return diagramsLayer
        .getSource()
        .getFeatures()
        .map((feature: any) => ({
          diagramType: feature.get("diagramType"),
        }));
    });
  }

  public async getLabels(): Promise<Array<any>> {
    return await this.page.evaluate(() => {
      const map = (window as any)["map"];
      const diagramsLayer = map
        .getLayers()
        .getArray()
        .find((layer: any) => layer.getClassName() === "labels");
      return diagramsLayer
        .getSource()
        .getFeatures()
        .map((feature: any) => ({
          id: feature.get("id"),
          name: feature.get("name"),
        }));
    });
  }

  public async waitForDiagramsCanvas(): Promise<void> {
    await this.page.locator(".diagrams > canvas").waitFor({ state: "attached" });
  }
}
