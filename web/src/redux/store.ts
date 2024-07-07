import { combineSlices, configureStore } from "@reduxjs/toolkit";
import planSheetsSlice from "./planSheets/planSheetsSlice";
import defineDiagramsSlice from "./defineDiagrams/defineDiagramsSlice";

const rootReducer = combineSlices(planSheetsSlice, defineDiagramsSlice);

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
