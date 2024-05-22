import { setupStore } from "@/redux/store";
import {
  SurveyFeaturesState,
  fetchFeatures,
  getError,
  getMarksForOpenlayers,
  getParcelsForOpenlayers,
  isFetching,
  surveyFeaturesSlice,
} from "@/redux/survey-features/surveyFeaturesSlice";
import { waitFor } from "@testing-library/react";

describe("surveyFeaturesSlice", () => {
  const initialState: SurveyFeaturesState = {
    isFetching: false,
    marks: [],
    primaryParcels: [],
    nonPrimaryParcels: [],
    centreLineParcels: [],
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
      primaryParcels: [],
      nonPrimaryParcels: [],
      centreLineParcels: [],
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

    const marks = getMarksForOpenlayers(store.getState());
    expect(marks).toHaveLength(13);
    expect(marks[0]).toStrictEqual({
      id: 1,
      name: "PEG 1 DP 123",
      label: "PEG 1 DP 123",
      markSymbol: 1,
      shape: {
        geometry: {
          type: "Point",
          coordinates: [170.970892, -45.068865],
        },
      },
    });

    const parcels = getParcelsForOpenlayers(store.getState());
    expect(parcels).toHaveLength(5);
    expect(parcels[0]).toStrictEqual({
      id: 1,
      parcelIntent: "FSIM",
      topoClass: "PRIM",
      shape: {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [170.970892, -45.068865],
              [170.971792900901, -45.068865],
              [170.971792900901, -45.0684145495496],
              [170.970892, -45.0684145495496],
              [170.970892, -45.068865],
            ],
          ],
        },
      },
    });
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
