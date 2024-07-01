import { AppStore, RootState, setupStore } from "@/redux/store";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/queries";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import React, { PropsWithChildren, ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { APPROX_DEGREES_PER_METRE, CommonBuilder, LatLong, OffsetXY } from "@/mocks/builders/CommonBuilder.ts";
import { chunk, flattenDeep } from "lodash-es";

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
    return (
      <LuiModalAsyncContextProvider>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>{children}</Provider>
        </QueryClientProvider>
      </LuiModalAsyncContextProvider>
    );
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

interface CoordinateMatchers<R = unknown> {
  toContainCoordinate(baseLocation: LatLong, offset?: OffsetXY): R;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect extends CoordinateMatchers {}
    interface Matchers<R> extends CoordinateMatchers<R> {}
  }
}
class AnyBuilder extends CommonBuilder<AnyBuilder> {}

const POS_TOLERANCE = APPROX_DEGREES_PER_METRE;

export const coordinateMatchers = {
  toContainCoordinate: (
    actualLocation: LatLong[] | LatLong[][] | LatLong[][][],
    baseLocation: LatLong,
    offset?: OffsetXY,
  ) => {
    const flatCoords = chunk(flattenDeep(actualLocation as unknown[]), 2) as LatLong[];
    const expectedLocation = new AnyBuilder().withOrigin(baseLocation).transformMetres(offset ?? [0, 0]);
    const pass = flatCoords.some(
      (l: LatLong) =>
        Math.abs(expectedLocation[0] - l[0]) < POS_TOLERANCE && Math.abs(expectedLocation[1] - l[1]) < POS_TOLERANCE,
    );
    return {
      message: () => `expecting ${actualLocation} toContainCoordinate ${baseLocation}, ${offset}`,
      pass,
    };
  },
};
