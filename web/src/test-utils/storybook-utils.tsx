import { expect } from "@storybook/jest";
import { StoryFn } from "@storybook/react";
import { fireEvent, userEvent, waitFor } from "@storybook/testing-library";
import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import { Provider } from "react-redux";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider.tsx";
import { setupStore } from "@/redux/store.ts";

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
      <InnerModalWrapper>{children}</InnerModalWrapper>
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
