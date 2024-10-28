import cytoscape from "cytoscape";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { removePageLines } from "@/redux/planSheets/planSheetsSlice";

export const useDeleteLines = () => {
  const dispatch = useAppDispatch();

  return (targets: cytoscape.EdgeSingular[]) => {
    const lineIds = targets.map((target) => target.data("lineId") as string);
    dispatch(removePageLines({ lineIds: [...new Set(lineIds)] }));
  };
};
