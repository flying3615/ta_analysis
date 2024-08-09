import { expect } from "@storybook/jest";
import { waitFor } from "@storybook/testing-library";
import { useEffect, useState } from "react";
import ReactModal from "react-modal";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

/* eslint-disable react-refresh/only-export-components */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const StorybookRouter = ({ children, url }: { children: React.ReactNode; url: string }) => {
  const router = createMemoryRouter(createRoutesFromElements(children), { initialEntries: [url] });
  return <RouterProvider router={router} />;
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
