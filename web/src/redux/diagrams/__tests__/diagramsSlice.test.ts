import { setupStore } from "@/redux/store";

import { waitFor } from "@testing-library/react";
import {
  diagramsSlice,
  DiagramsState,
  fetchDiagrams,
  getDiagramsError,
  getDiagramsForOpenlayers,
  isDiagramsFetching,
} from "@/redux/diagrams/diagramsSlice.ts";
import { TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder.ts";
import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";

describe("diagramsSlice", () => {
  const initialState: DiagramsState = {
    isFetching: false,
    isFulfilled: false,
    diagrams: [],
    error: undefined,
  };

  let store = setupStore();

  beforeEach(() => {
    store = setupStore({ diagrams: initialState });
  });

  it("should handle initial state", () => {
    expect(diagramsSlice.reducer(undefined, { type: "unknown" })).toStrictEqual({
      isFetching: false,
      isFulfilled: false,
      diagrams: [],
      error: undefined,
    });
  });

  it("should handle fetchDiagrams for successful response", async () => {
    expect(isDiagramsFetching(store.getState())).toBe(false);

    store.dispatch(fetchDiagrams(123));
    store.dispatch(fetchDiagrams(124));

    // while waiting for fetch response
    expect(isDiagramsFetching(store.getState())).toBe(true);

    // when response available, isDiagramsFetching will switch over to false
    await waitFor(() => expect(isDiagramsFetching(store.getState())).toBe(false));

    expect(getDiagramsError(store.getState())).toBeUndefined();

    const diagrams = getDiagramsForOpenlayers(store.getState());
    expect(diagrams).toHaveLength(2);

    expect(diagrams[0]?.id).toBe(1);
    expect((diagrams[0] as Record<string, string>)?.["diagramType"]).toBe(CpgDiagramType.SYSP);
    expect(diagrams[0]?.shape?.["geometry"]?.coordinates?.[0]).toHaveLength(5);
    expect(diagrams[0]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-50, 50]);
    expect(diagrams[0]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [150, 50]);
    expect(diagrams[0]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [150, 150]);
    expect(diagrams[0]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-50, 150]);

    expect(diagrams[1]?.id).toBe(2);
    expect((diagrams[1] as Record<string, string>)?.["diagramType"]).toBe(CpgDiagramType.SYSP);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates?.[0]).toHaveLength(7);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-50, 50]);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [250, 50]);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [250, 250]);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [150, 250]);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [150, 150]);
    expect(diagrams[1]?.shape?.["geometry"]?.coordinates).toContainCoordinate(TEST_LOCATION_LAT_LONG, [-50, 150]);
  });

  it("should handle fetchDiagrams for unsuccessful response", async () => {
    expect(isDiagramsFetching(store.getState())).toBe(false);

    store.dispatch(fetchDiagrams(404));

    // while waiting for fetch response
    expect(isDiagramsFetching(store.getState())).toBe(true);

    // when response available, isDiagramsFetching will switch over to false
    await waitFor(() => expect(isDiagramsFetching(store.getState())).toBe(false));

    expect(getDiagramsForOpenlayers(store.getState())).toStrictEqual([]);

    // assert individual keys to avoid the "stack" value
    const error = getDiagramsError(store.getState());
    expect(error?.code).toBe(404);
    expect(error?.name).toBe("Not found");
    expect(error?.message).toBe("Not found");
  });
});
