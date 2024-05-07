import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { surveyFeaturesSlice } from "./survey-features/surveyFeaturesSlice";

const rootReducer = combineSlices(surveyFeaturesSlice);

export type RootState = ReturnType<typeof rootReducer>;

const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    reducer: rootReducer,
    preloadedState,
  });

export const store = setupStore();

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
