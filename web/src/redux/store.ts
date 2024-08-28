import { combineSlices, configureStore } from "@reduxjs/toolkit";

import { asyncDispatchMiddleware } from "@/redux/customMiddleware.ts";

import defineDiagramsSlice from "./defineDiagrams/defineDiagramsSlice";
import planSheetsSlice from "./planSheets/planSheetsSlice";

const rootReducer = combineSlices(planSheetsSlice, defineDiagramsSlice);

export type RootState = ReturnType<typeof rootReducer>;

export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(asyncDispatchMiddleware),
    reducer: rootReducer,
    preloadedState,
  });

export const store = setupStore();

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
