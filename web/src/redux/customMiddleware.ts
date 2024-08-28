import { Middleware } from "@reduxjs/toolkit";
import { Dispatch } from "redux";

import { populateLookupTblAsync } from "@/redux/planSheets/planSheetsThunk.ts";

export const asyncDispatchMiddleware: Middleware =
  ({ dispatch, getState }) =>
  (next) =>
  async (action: unknown) => {
    if (typeof action === "function") {
      return (action as (dispatch: Dispatch) => Promise<never>)(dispatch);
    }
    const prevPlanState = getState().planSheets;
    const result = next(action);
    const nextPlanState = getState().planSheets;

    // Compare previous and next state
    if (prevPlanState.pages !== nextPlanState.pages || prevPlanState.diagrams !== nextPlanState.diagrams) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      dispatch(populateLookupTblAsync());
    }
    return result;
  };
