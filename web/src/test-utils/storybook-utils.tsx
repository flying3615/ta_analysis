import { PanelInstanceContext, PanelsContextProvider } from "@linzjs/windows";
import { PanelInstanceContextType } from "@linzjs/windows/dist/panel/PanelInstanceContext";
import { expect } from "@storybook/jest";
import { StoryFn } from "@storybook/react";
import { within } from "@storybook/test";
import { fireEvent, userEvent, waitFor } from "@storybook/testing-library";
import { UserEvent } from "@testing-library/user-event";
import React, { PropsWithChildren, useEffect, useState } from "react";
import ReactModal from "react-modal";
import { Provider } from "react-redux";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
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

export const clickAtCoordinates = (
  cytoscapeNodeLayer: HTMLElement,
  x: number,
  y: number,
  button: number | undefined = undefined,
) => {
  fireEvent.mouseOver(cytoscapeNodeLayer, { clientX: x, clientY: y });
  fireEvent.mouseDown(cytoscapeNodeLayer, { button, clientX: x, clientY: y });
  fireEvent.mouseUp(cytoscapeNodeLayer, { button, clientX: x, clientY: y });
};

export const clickMultipleCoordinates = (
  cytoscapeNodeLayer: HTMLElement,
  coordinates: { x: number; y: number }[],
  button: number | undefined = undefined,
) => {
  coordinates.forEach(({ x, y }) => {
    fireEvent.mouseOver(cytoscapeNodeLayer, { clientX: x, clientY: y });
    fireEvent.mouseDown(cytoscapeNodeLayer, { button, clientX: x, clientY: y, ctrlKey: true });
    fireEvent.mouseUp(cytoscapeNodeLayer, { button, clientX: x, clientY: y, ctrlKey: true });
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

export function getCytoscapeNodeLayer(cytoscapeElement: HTMLElement): HTMLElement {
  // eslint-disable-next-line testing-library/no-node-access
  return (cytoscapeElement.firstChild as HTMLElement).children[2] as HTMLElement;
}

export class TestCanvas {
  user: UserEvent;
  canvas: HTMLCanvasElement;

  public static Create = async (canvasElement: HTMLElement, firstSelect = "Select Labels") => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(await canvas.findByTitle(firstSelect));
    await sleep(500);
    return new TestCanvas(user, getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas")));
  };

  constructor(user: UserEvent, canvas: HTMLCanvasElement) {
    this.user = user;
    this.canvas = canvas;
  }

  withCtrl = async (action: () => Promise<void>) => {
    await this.user.keyboard("{Control>}"); // Press Ctrl (without releasing it)
    await action();
    await this.user.keyboard("{/Control}");
  };

  click = async (
    clientCoord: { clientX: number; clientY: number },
    button: "MouseLeft" | "MouseRight" = "MouseLeft",
  ) => {
    await this.user.pointer({
      keys: `[${button}]`,
      target: this.canvas,
      coords: clientCoord,
    });
  };
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
  await sleep(500);

  // drag
  fireEvent.mouseDown(element, positions[0]);
  for (const position of positions) {
    fireEvent.mouseMove(element, position);
    await sleep(100);
  }
  fireEvent.mouseUp(element, positions[positions.length - 1]);
}
