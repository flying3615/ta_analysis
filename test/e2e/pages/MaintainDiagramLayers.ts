import { Locator } from "@playwright/test";
import { Page } from "playwright-core";

const maintainDiagramsByTypeTab = "maintainDiagramsByType-tab-panel";
const maintainDiagramsByIdTab = "maintainDiagramsById-tab-panel";

export class MaintainDiagramLayers {
  readonly page: Page;
  readonly listBox: Locator;
  readonly individualUserDefinedDiagramsTab: Locator;
  readonly diagramTypeTab: Locator;
  readonly diagramLayersPanelSaveButton: Locator;
  readonly diagramLayersPanelCloseButton: Locator;
  readonly unsavedChangesDialogSaveButton: Locator;
  readonly overwrittenChangesDialogContinueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listBox = page.getByRole("combobox");
    this.individualUserDefinedDiagramsTab = page.getByRole("tab", {
      name: "Individual user-defined",
    });
    this.diagramTypeTab = page.getByRole("tab", {
      name: "Diagram type",
    });
    this.diagramLayersPanelSaveButton = page.getByRole("button", {
      name: "Save",
    });
    this.diagramLayersPanelCloseButton = page.getByRole("button", {
      name: "Close",
    });
    this.unsavedChangesDialogSaveButton = page.locator(`dialog button:has-text("Save")`);
    this.overwrittenChangesDialogContinueButton = page.locator(`dialog button:has-text("Continue")`);
  }

  /** Locator for a row within the table */
  private rowLocator(tabId: string, rowIndex: number): Locator {
    return this.page.locator(`.LuiTabsPanel[id="${tabId}"] .ag-row[row-index="${rowIndex}"]`);
  }

  /** Click Layers select button for the specified tab and table row (zero-indexed row) */
  private async clickLayersSelectButton(tabId: string, rowIndex: number): Promise<void> {
    await this.rowLocator(tabId, rowIndex).locator('.ag-cell[col-id="selected"] button').click();
  }

  /** Click Layers select button for the specified tab and table row (zero-indexed row) */
  public async clickLayersSelectButtonInDiagramsByTypeTab(rowIndex: number): Promise<void> {
    await this.clickLayersSelectButton(maintainDiagramsByTypeTab, rowIndex);
  }

  /** Click Layers select button for the specified tab and table row (zero-indexed row) */
  public async clickLayersSelectButtonInDiagramsByIDTab(rowIndex: number): Promise<void> {
    await this.clickLayersSelectButton(maintainDiagramsByIdTab, rowIndex);
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  private async getLayerSelectedState(tabId: string, rowIndex: number): Promise<string> {
    return this.rowLocator(tabId, rowIndex)
      .locator('.ag-cell[col-id="selected"] button .LuiIcon')
      .getAttribute("aria-label");
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  public async getLayerSelectedStateInDiagramsByTypeTab(rowIndex: number): Promise<string> {
    return this.getLayerSelectedState(maintainDiagramsByTypeTab, rowIndex);
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  public async getLayerSelectedStateInDiagramsByIDTab(rowIndex: number): Promise<string> {
    return this.getLayerSelectedState(maintainDiagramsByIdTab, rowIndex);
  }

  /** Click Labels checkbox for the specified tab and table row (zero-indexed row) */
  private async clickLabelsCheckbox(tabId: string, rowIndex: number): Promise<void> {
    await this.rowLocator(tabId, rowIndex).locator('.ag-cell[col-id="label"] input').click();
  }

  /** Click Labels checkbox for the specified tab and table row (zero-indexed row) */
  public async clickLabelsCheckboxInDiagramsByTypeTab(rowIndex: number): Promise<void> {
    await this.clickLabelsCheckbox(maintainDiagramsByTypeTab, rowIndex);
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  private async getLabelsSelectedState(tabId: string, rowIndex: number): Promise<string> {
    return this.rowLocator(tabId, rowIndex).locator('.ag-cell[col-id="label"] .ag-wrapper').getAttribute("class");
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  public async getLabelsSelectedStateInDiagramsByTypeTab(rowIndex: number): Promise<string> {
    return this.getLabelsSelectedState(maintainDiagramsByTypeTab, rowIndex);
  }

  /** Get Layers select status for the specified tab and table row (zero-indexed row) */
  public async getLabelsSelectedStateInDiagramsByIDTab(rowIndex: number): Promise<string> {
    return this.getLabelsSelectedState(maintainDiagramsByIdTab, rowIndex);
  }

  /** Wait for the AG Grid */
  public async waitForGridReady(): Promise<void> {
    await this.page.locator(".Grid-ready").waitFor({ state: "visible" });
  }
}
