import cytoscape from "cytoscape";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { setLineHide } from "@/redux/planSheets/planSheetsSlice";

export const useChangeLine = () => {
  const dispatch = useAppDispatch();
  return (target: cytoscape.EdgeSingular, hidden: boolean) => {
    const lineId = target.data("lineId") as string;
    if (lineId) {
      dispatch(setLineHide({ id: lineId, hide: hidden }));
    }
  };
};
