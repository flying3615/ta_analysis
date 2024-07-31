import { Locator } from "@playwright/test";
import { Page } from "playwright-core";

export class DefineDiagramsPage {
  readonly page: Page;
  readonly definePrimaryDiagramButton: Locator;
  readonly definePrimaryDiagramByRectangle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.definePrimaryDiagramButton = page.getByRole("button", { name: "Define primary diagram" });
    this.definePrimaryDiagramByRectangle = page.getByRole("menuitem", { name: "Define primary diagram by rectangle" });
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

  public async waitForDiagramsCanvas(): Promise<void> {
    await this.page.locator(".diagrams > canvas").waitFor({ state: "attached" });
  }
}
