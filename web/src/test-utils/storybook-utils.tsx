import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

/* eslint-disable react-refresh/only-export-components */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const StorybookRouter = ({ children, url }: { children: React.ReactNode; url: string }) => {
  const router = createMemoryRouter(createRoutesFromElements(children), { initialEntries: [url] });
  return <RouterProvider router={router} />;
};
