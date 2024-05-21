import { AppStore, RootState, setupStore } from "@/redux/store";
import { RenderOptions, render, RenderResult } from "@testing-library/react";
import React, { PropsWithChildren, ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export function renderWithReduxProvider(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: PropsWithChildren): React.JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export const renderCompWithReduxAndRoute = (
  component: ReactElement,
  url = "/",
  route = "/",
  options?: ExtendedRenderOptions,
): RenderResult => {
  return renderWithReduxProvider(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={route} element={component} />
      </Routes>
    </MemoryRouter>,
    options,
  );
};

export const renderMultiCompWithReduxAndRoute = (
  url = "/",
  routes: { route: string; component: ReactElement }[],
  options?: ExtendedRenderOptions,
): RenderResult => {
  return renderWithReduxProvider(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        {routes.map((r, idx) => {
          return <Route key={idx} path={r.route} element={r.component} />;
        })}
      </Routes>
    </MemoryRouter>,
    options,
  );
};
