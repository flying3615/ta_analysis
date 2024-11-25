import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick";
import { PanelInstanceContext, PanelsContextProvider } from "@linzjs/windows";
import { PanelInstanceContextType } from "@linzjs/windows/dist/panel/PanelInstanceContext";
import { expect } from "@storybook/jest";
import { StoryFn } from "@storybook/react";
import { screen } from "@storybook/testing-library";
import { fireEvent, userEvent, waitFor, within } from "@storybook/testing-library";
import { UserEvent } from "@testing-library/user-event";
import cytoscape from "cytoscape";
import React, { PropsWithChildren, useEffect, useState } from "react";
import ReactModal from "react-modal";
import { Provider } from "react-redux";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { setupStore } from "@/redux/store";

/* eslint-disable react-refresh/only-export-components */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const StorybookRouter = ({ children, url }: { children: React.ReactNode; url: string }) => {
  const router = createMemoryRouter(createRoutesFromElements(children), { initialEntries: [url] });
  return <RouterProvider router={router} />;
};

export const withProviderDecorator =
  (mockedState: Record<string, unknown> = {}) =>
  // eslint-disable-next-line react/display-name
  (Story: StoryFn) => {
    const mockedStore = setupStore(mockedState);
    return (
      <Provider store={mockedStore}>
        <CytoscapeContextProvider>
          <Story />
        </CytoscapeContextProvider>
      </Provider>
    );
  };

/**
 * There is a bug in React modal that means it will try and get the root element before it has rendered.
 * This wrapper component fixes this.
 * see: https://stackoverflow.com/questions/48269381/warning-react-modal-app-element-is-not-defined-please-use-modal-setappeleme
 */
export const ModalStoryWrapper = ({ children }: { children: React.ReactNode }) => {
  const InnerModalWrapper = ({ children }: { children: React.ReactNode }) => {
    const [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
      ReactModal.setAppElement("#root");

      setReady(true);
    }, []);

    if (!ready) return <p>Loading</p>;

    return <>{children}</>;
  };

  return (
    <div id="root">
      <PanelsContextProvider baseZIndex={500}>
        <InnerModalWrapper>{children}</InnerModalWrapper>
      </PanelsContextProvider>
    </div>
  );
};

/**
 * It's hard to tell map layers have completed loading as sometimes one completed load triggers another.
 * This checks no loads have started in the past 1000ms and assumes all loads have completed.
 */
export const waitForInitialMapLoadsToComplete = async () => {
  /* eslint-disable-next-line */
  (window as any).lastLoadingTimestamp = undefined;
  await waitFor(
    async () => {
      /* eslint-disable-next-line */
      const t = (window as any).lastLoadingTimestamp;
      await expect(t).toBeDefined();
      await expect(Date.now() - t).toBeGreaterThan(1000);
    },
    // Need to wait long enough for prepare dataset error
    { timeout: 25000 },
  );
};

export const getCytoCanvas = (element: Element): HTMLCanvasElement => {
  // eslint-disable-next-line testing-library/no-node-access
  const cytoCanvas = element.querySelector("canvas");
  if (!cytoCanvas) {
    throw "no canvas to click";
  }
  return cytoCanvas;
};

export const click = async (
  canvas: HTMLCanvasElement,
  clientCoord: { clientX: number; clientY: number },
  button: "MouseLeft" | "MouseRight" = "MouseLeft",
) => {
  await userEvent.pointer({
    keys: `[${button}]`,
    target: canvas,
    coords: clientCoord,
  });
};

export const tabletLandscapeParameters = {
  viewport: {
    defaultViewport: "tablet",
    defaultOrientation: "landscape",
  },
};

// For fireEvent.click, left mouse button is 0 (default), right mouse button is 2
export const LEFT_MOUSE_BUTTON = 0; // default
export const RIGHT_MOUSE_BUTTON = 2;

export const clickAtPosition = (
  cytoscapeNodeLayer: HTMLElement,
  coordinates: { clientX: number; clientY: number },
  button: number | undefined = undefined,
) => {
  clickAtCoordinates(cytoscapeNodeLayer, [coordinates.clientX, coordinates.clientY], button);
};

export const clickAtCoordinates = (
  cytoscapeNodeLayer: HTMLElement,
  location: [number, number],
  button: number | undefined = undefined,
  withCtrlKey = false,
) => {
  const [x, y] = location;
  fireEvent.mouseOver(cytoscapeNodeLayer, { clientX: x, clientY: y });
  fireEvent.mouseDown(cytoscapeNodeLayer, { button: button, clientX: x, clientY: y, ctrlKey: withCtrlKey });
  fireEvent.mouseUp(cytoscapeNodeLayer, { button: button, clientX: x, clientY: y, ctrlKey: withCtrlKey });
};

export const pressEscapeKey = (cytoscapeNodeLayer: HTMLElement) => {
  fireEvent.keyDown(cytoscapeNodeLayer, { key: "Escape" });
  fireEvent.keyUp(cytoscapeNodeLayer, { key: "Escape" });
};

export const clickMultipleCoordinates = (
  cytoscapeNodeLayer: HTMLElement,
  coordinates: { x: number; y: number }[],
  button: number | undefined = undefined,
) => {
  coordinates.forEach(({ x, y }) => {
    clickAtCoordinates(cytoscapeNodeLayer, [x, y], button, true);
  });
};

export const PanelInstanceContextMock = ({
  children,
  ...props
}: PropsWithChildren<Partial<PanelInstanceContextType>>) => {
  const [title, setTitle] = useState<string>("");
  return (
    <PanelInstanceContext.Provider
      value={{
        title,
        setTitle,
        dockId: undefined,
        zIndex: 100,
        panelClose: () => {},
        dock: () => {},
        docked: false,
        panelName: "panelName",
        setPanelWindow: () => {},
        bounds: undefined,
        bringPanelToFront: () => {},
        panelPoppedOut: false,
        panelTogglePopout: () => {},
        undock: () => {},
        uniqueId: "uniqueId",
        ...props,
      }}
    >
      {children}
    </PanelInstanceContext.Provider>
  );
};

export function getCytoscapeOffsetInCanvas(
  canvasElement: HTMLElement,
  cytoscapeElement: HTMLElement,
): { cyOffsetX: number; cyOffsetY: number } {
  const canvasRect = canvasElement.getBoundingClientRect();

  const cytoscapeRect = cytoscapeElement.getBoundingClientRect();
  console.log("canvasRect", canvasRect, "cytoscapeRect", cytoscapeRect);

  const cyOffsetX = cytoscapeRect.left - canvasRect.left;
  const cyOffsetY = cytoscapeRect.top - canvasRect.top;
  console.log("cyOffset", cyOffsetX, cyOffsetY);

  return { cyOffsetX, cyOffsetY };
}

export function getCytoscapeNodeLayer(
  cytoscapeElement: HTMLElement,
  layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
): HTMLElement {
  // eslint-disable-next-line testing-library/no-node-access
  return cytoscapeElement.querySelector(`[data-id="${layer}"]`) as HTMLElement;
}

export function toClientXY(position: [number, number]): { clientX: number; clientY: number } {
  const [x, y] = position;
  return { clientX: x, clientY: y };
}

export function toXY(position: [number, number]): { x: number; y: number } {
  const [x, y] = position;
  return { x: x, y: y };
}

export class TestCanvas {
  user: UserEvent;
  canvasElement: HTMLElement;
  cytoscapeCanvas: HTMLElement;
  cyOffsetX: number;
  cyOffsetY: number;

  public static Create = async (canvasElement: HTMLElement, firstSelect: string | null = null) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const test = new TestCanvas(user, canvasElement, await canvas.findByTestId("MainCytoscapeCanvas"));
    if (firstSelect === null) return test;
    await test.clickTitle(firstSelect);
    return test;
  };

  constructor(user: UserEvent, canvasElement: HTMLElement, cytoscapeCanvas: HTMLElement) {
    this.user = user;
    this.canvasElement = canvasElement;
    this.cytoscapeCanvas = cytoscapeCanvas;
    const offset = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeCanvas);
    this.cyOffsetX = offset.cyOffsetX;
    this.cyOffsetY = offset.cyOffsetY;
  }

  async waitForCytoscape() {
    // For now, a simple wait. Maybe a better solution can be found?
    await sleep(400);
  }

  async clickTitle(title: string) {
    await this.user.click(await within(this.canvasElement).findByTitle(title));
  }

  toCoords(location: [number, number]): [number, number] {
    return [this.cyOffsetX + location[0], this.cyOffsetY + location[1]];
  }

  toClientXY(location: [number, number]): { clientX: number; clientY: number } {
    return toClientXY(this.toCoords(location));
  }

  async userClick(location: [number, number]) {
    await sleep(500);
    await this.user.pointer({
      target: getCytoCanvas(this.cytoscapeCanvas),
      coords: this.toClientXY(location),
      keys: "[MouseLeft]",
    });
  }

  async click(location: [number, number], withCtrl = false) {
    await this.waitForCytoscape();
    clickAtCoordinates(getCytoCanvas(this.cytoscapeCanvas), this.toCoords(location), LEFT_MOUSE_BUTTON, withCtrl);
  }

  clickAt(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
    button = LEFT_MOUSE_BUTTON,
    withCtrl = false,
  ) {
    fireEvent.mouseMove(this.getLayer(layer), { ...this.toClientXY(location) });
    fireEvent.mouseDown(this.getLayer(layer), { ...this.toClientXY(location), button: button, ctrlKey: withCtrl });
    fireEvent.mouseUp(this.getLayer(layer), { ...this.toClientXY(location), button: button, ctrlKey: withCtrl });
  }

  async mouseClick(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
    button = LEFT_MOUSE_BUTTON,
    withCtrl = false,
  ) {
    await this.waitForCytoscape();
    this.clickAt(location, layer, button, withCtrl);
  }

  async multiSelect(locations: [number, number][]) {
    await this.waitForCytoscape();
    for (const location of locations) {
      await this.leftClick(location, "layer2-node", true);
    }
  }

  async leftClick(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
    withCtrl = false,
  ) {
    await this.mouseClick(location, layer, LEFT_MOUSE_BUTTON, withCtrl);
  }

  async rightClick(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
  ) {
    await this.mouseClick(location, layer, RIGHT_MOUSE_BUTTON);
  }

  async leftClickAndDrag(
    fromLocation: [number, number],
    toLocation: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
    withCtrl = false,
  ) {
    await this.waitForCytoscape();
    fireEvent.mouseMove(this.getLayer(layer), { ...this.toClientXY(fromLocation) });
    fireEvent.mouseDown(this.getLayer(layer), {
      ...this.toClientXY(fromLocation),
      button: LEFT_MOUSE_BUTTON,
      ctrl: withCtrl,
    });
    fireEvent.mouseMove(this.getLayer(layer), { ...this.toClientXY(toLocation) });
    fireEvent.mouseUp(this.getLayer(layer), {
      ...this.toClientXY(toLocation),
      button: LEFT_MOUSE_BUTTON,
      ctrl: withCtrl,
    });
  }

  getLayer(layer: "layer0-selectbox" | "layer1-drag" | "layer2-node"): HTMLElement {
    // eslint-disable-next-line testing-library/no-node-access
    return getCytoscapeNodeLayer(this.canvasElement, layer);
  }

  async mouseMove(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
  ) {
    await this.waitForCytoscape();
    await userEvent.pointer({ target: this.getLayer(layer), coords: this.toClientXY(location) });
    // fireEvent.mouseMove(, { ...this.toClientXY(location) });
  }

  async enterAt(location: [number, number], layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node") {
    await this.waitForCytoscape();
    fireEvent.mouseMove(this.getLayer(layer), { ...this.toClientXY(location) });
    fireEvent.keyDown(this.getLayer(layer), { key: "Enter" });
  }

  async doubleClick(
    location: [number, number],
    layer: "layer0-selectbox" | "layer1-drag" | "layer2-node" = "layer2-node",
  ) {
    await this.waitForCytoscape();
    fireEvent.mouseMove(this.getLayer(layer), { ...this.toClientXY(location) });
    fireEvent.mouseDown(this.getLayer(layer), { ...this.toClientXY(location), button: LEFT_MOUSE_BUTTON });
    fireEvent.mouseUp(this.getLayer(layer), { ...this.toClientXY(location), button: LEFT_MOUSE_BUTTON });
    fireEvent.mouseDown(this.getLayer(layer), { ...this.toClientXY(location), button: LEFT_MOUSE_BUTTON });
    fireEvent.mouseUp(this.getLayer(layer), { ...this.toClientXY(location), button: LEFT_MOUSE_BUTTON });
  }

  async hoverOver(location: [number, number]) {
    await this.waitForCytoscape();
    const target = getCytoCanvas(await within(this.canvasElement).findByTestId("MainCytoscapeCanvas"));
    await userEvent.pointer({ target: target, coords: this.toClientXY(location) });
  }

  async contextMenu(
    _: {
      at: [number, number];
      select: string;
    },
    action: "" | "hover" = "",
  ): Promise<HTMLElement> {
    const { at, select } = _; // not so nice way to get named arguments
    await this.rightClick(at);
    const ctxMenuElement = await within(this.canvasElement).findByTestId("cytoscapeContextMenu");
    if (!select) return ctxMenuElement;
    console.log(select);
    const propertiesMenuItem = within(ctxMenuElement).getByText(select);
    if (action === "hover") {
      await this.user.hover(propertiesMenuItem);
    } else {
      await this.user.click(propertiesMenuItem);
    }
    return propertiesMenuItem;
  }

  async findMenuItem(item: string): Promise<HTMLElement> {
    for (const candidate of await within(screen.getByTestId("cytoscapeContextMenu")).findAllByRole("menuitem")) {
      if (candidate.textContent === item) return candidate;
    }
    throw Error(`Menu item ${item} could not be found.`);
  }

  findProperty(luiType: "TextInput" | "RadioInput" | "Select", withLabel: string): Element {
    // can probably do this better with findQuick
    const propertySelector = new Map<string, string>([
      ["TextInput", ".LuiTextInput-input"],
      ["RadioInput", ".LuiRadioInput-fieldset"],
      ["Select", ".LuiSelect-select"],
    ]).get(luiType);
    for (const element of this.canvasElement.querySelectorAll("div.property-wrap")) {
      // eslint-disable-next-line testing-library/no-node-access
      const candidates = [
        // eslint-disable-next-line testing-library/no-node-access
        ...element.querySelectorAll(`span`),
        // eslint-disable-next-line testing-library/no-node-access
        element,
      ];
      for (const candidate of candidates) {
        // eslint-disable-next-line testing-library/no-node-access
        const label = candidate.querySelector(`span`);
        if (label !== null && label.textContent === withLabel) {
          // eslint-disable-next-line testing-library/no-node-access
          const properties = candidate.querySelectorAll(propertySelector as string);
          if (properties.length === 1) return properties[0] as Element;
        }
      }
    }
    throw Error(`Could not find div.property-wrap element with ${propertySelector} and text matching ${withLabel}`);
  }

  async clickCancelFooter() {
    const buttonGroup = await findQuick({ classes: ".footer" });
    const cancelButton = await findQuick({ tagName: "button", text: "Cancel" }, buttonGroup);
    await userEvent.click(cancelButton);
  }

  async clickButton(buttonName: string) {
    await userEvent.click(within(this.canvasElement).getByRole("button", { name: buttonName }));
  }
}

export interface MousePosition {
  clientX: number;
  clientY: number;
}

export async function selectAndDrag(element: HTMLElement, from: MousePosition, to: MousePosition, numSteps = 2) {
  const positions: MousePosition[] = [from];
  const stepDx = (to.clientX - from.clientX) / numSteps;
  const stepDy = (to.clientY - from.clientY) / numSteps;
  for (let step = 1; step <= numSteps; step++) {
    positions.push({
      clientX: from.clientX + step * stepDx,
      clientY: from.clientY + step * stepDy,
    });
  }

  // click to select
  fireEvent.mouseDown(element, positions[0]);
  fireEvent.mouseUp(element, positions[0]);
  await sleep(400);

  // drag
  fireEvent.mouseDown(element, positions[0]);
  for (const position of positions) {
    fireEvent.mouseMove(element, position);
    await sleep(100);
  }
  fireEvent.mouseUp(element, positions[positions.length - 1]);
}

export async function multiSelectAndDrag(
  canvas: HTMLElement,
  positions: MousePosition[],
  dragTo: MousePosition,
  numSteps = 2,
) {
  // Multi-select positions by holding Ctrl key
  for (const position of positions) {
    fireEvent.mouseDown(canvas, { ...position, ctrlKey: true });
    fireEvent.mouseUp(canvas, { ...position, ctrlKey: true });
  }
  await sleep(400);

  if (positions.length === 0) {
    return;
  }

  // Drag the first selected position
  const from = positions[0];
  if (!from) {
    return;
  }
  const steps: MousePosition[] = [from];
  const stepDx = (dragTo.clientX - from.clientX) / numSteps;
  const stepDy = (dragTo.clientY - from.clientY) / numSteps;
  for (let step = 1; step <= numSteps; step++) {
    steps.push({
      clientX: from.clientX + step * stepDx,
      clientY: from.clientY + step * stepDy,
    });
  }

  fireEvent.mouseDown(canvas, from);
  for (const step of steps) {
    fireEvent.mouseMove(canvas, step);
    await sleep(100);
  }
  fireEvent.mouseUp(canvas, steps[steps.length - 1]);
}

export const checkCytoElementProperties = async (
  selector: string,
  expectedProperties: {
    displayState?: DisplayStateEnum;
    textRotation?: number;
    anchorAngle?: number;
    pointOffset?: number;
    color?: string;
    styleProperty?: string;
    className?: string;
    position?: cytoscape.Position;
  },
) => {
  const element = window.cyRef.$(selector);
  console.log("position", element.position());
  if (element.length > 0) {
    if (expectedProperties.displayState !== undefined) {
      const data = element.data() as INodeDataProperties;
      await expect(data.displayState).toBe(expectedProperties.displayState);
    }

    if (expectedProperties.textRotation !== undefined) {
      const data = element.data() as INodeDataProperties;
      await expect(data.textRotation).toBe(expectedProperties.textRotation);
    }

    if (expectedProperties.anchorAngle !== undefined) {
      const data = element.data() as INodeDataProperties;
      await expect(data.anchorAngle).toBe(expectedProperties.anchorAngle);
    }

    if (expectedProperties.pointOffset !== undefined) {
      const data = element.data() as INodeDataProperties;
      await expect(data.pointOffset).toBe(expectedProperties.pointOffset);
    }

    if (expectedProperties.color !== undefined && expectedProperties.styleProperty !== undefined) {
      const color = element.style(expectedProperties.styleProperty) as string;
      await expect(color).toBe(expectedProperties.color);
    }

    if (expectedProperties.className !== undefined) {
      const classes = element.classes();
      await expect(classes).toContain(expectedProperties.className);
    }

    if (expectedProperties.position !== undefined) {
      const position = element.position();
      const isClose = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
      const isPositionClose =
        isClose(position.x, expectedProperties.position.x, 0.01) &&
        isClose(position.y, expectedProperties.position.y, 0.01);
      await expect(isPositionClose).toBe(true);
    }
  } else {
    console.log(`Element with ID ${selector} not found.`);
  }
};

export async function waitForLoadingSpinnerToDisappear() {
  return await waitFor(
    async () => {
      await sleep(1000); // wait for spinner
      const spinner = screen.queryByTestId("loading-spinner");
      await expect(spinner).toBeNull();
    },
    { timeout: 10000 },
  );
}
