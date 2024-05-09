import { setupStore } from "@/redux/store";
import {
  SurveyFeaturesState,
  fetchFeatures,
  getError,
  getMarksForOpenlayers,
  isFetching,
  surveyFeaturesSlice,
} from "@/redux/survey-features/surveyFeaturesSlice";
import { waitFor } from "@testing-library/react";

describe("surveyFeaturesSlice", () => {
  const initialState: SurveyFeaturesState = {
    isFetching: false,
    marks: [],
    error: undefined,
  };

  let store = setupStore();

  beforeEach(() => {
    store = setupStore({ surveyFeatures: initialState });
  });

  it("should handle initial state", () => {
    expect(surveyFeaturesSlice.reducer(undefined, { type: "unknown" })).toStrictEqual({
      isFetching: false,
      marks: [],
      error: undefined,
    });
  });

  it("should handle fetchFeatures for successful response", async () => {
    expect(isFetching(store.getState())).toBe(false);

    store.dispatch(fetchFeatures(123));

    // while waiting for fetch response
    expect(isFetching(store.getState())).toBe(true);

    // when response available, isFetching will switch over to false
    await waitFor(() => expect(isFetching(store.getState())).toBe(false));

    expect(getError(store.getState())).toBeUndefined();
    expect(getMarksForOpenlayers(store.getState())).toStrictEqual([
      {
        id: 1,
        name: "PEG 1 DP 123",
        label: "PEG 1 DP 123",
        markSymbol: 1,
        shape: {
          geometry: {
            type: "Point",
            coordinates: [10, 10],
          },
        },
      },
      {
        id: 2,
        name: "PEG 1 DP 123",
        label: "PEG 1 DP 123",
        markSymbol: 1,
        shape: {
          geometry: {
            type: "Point",
            coordinates: [10, 10],
          },
        },
      },
      {
        id: 3,
        name: "PEG 1 DP 123",
        label: "PEG 1 DP 123",
        markSymbol: 1,
        shape: {
          geometry: {
            type: "Point",
            coordinates: [10, 10],
          },
        },
      },
    ]);
  });

  it("should handle fetchFeatures for unsuccessful response", async () => {
    expect(isFetching(store.getState())).toBe(false);

    store.dispatch(fetchFeatures(404));

    // while waiting for fetch response
    expect(isFetching(store.getState())).toBe(true);

    // when response available, isFetching will switch over to false
    await waitFor(() => expect(isFetching(store.getState())).toBe(false));

    expect(getMarksForOpenlayers(store.getState())).toStrictEqual([]);

    // assert individual keys to avoid the "stack" value
    const error = getError(store.getState());
    expect(error?.code).toBe(404);
    expect(error?.name).toBe("Not found");
    expect(error?.message).toBe("Not found");
  });
});
