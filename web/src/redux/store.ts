import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { surveyFeaturesSlice } from "@/redux/survey-features/surveyFeaturesSlice";
import { planSlice } from "@/redux/plan/planSlice.ts";
import { diagramsSlice } from "@/redux/diagrams/diagramsSlice.ts";

const rootReducer = combineSlices(surveyFeaturesSlice, planSlice, diagramsSlice);

export type RootState = ReturnType<typeof rootReducer>;

export const setupStore = (preloadedState?: Partial<RootState>) =>
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
