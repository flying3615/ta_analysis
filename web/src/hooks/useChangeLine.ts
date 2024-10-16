import cytoscape from "cytoscape";

import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { setLineHide } from "@/redux/planSheets/planSheetsSlice.ts";

export const useChangeLine = () => {
  const dispatch = useAppDispatch();

  return (target: cytoscape.EdgeSingular, hidden: boolean) => {
    const lineId = target.data("id").split("_")[0];

    dispatch(setLineHide({ id: lineId, hide: hidden }));
  };
};
