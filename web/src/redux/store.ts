import { combineSlices, configureStore } from "@reduxjs/toolkit";

const rootReducer = combineSlices();

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
