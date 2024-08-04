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
