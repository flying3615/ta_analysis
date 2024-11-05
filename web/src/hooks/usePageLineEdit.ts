import cytoscape from "cytoscape";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { removePageLines } from "@/redux/planSheets/planSheetsSlice";

export const usePageLineEdit = () => {
  const dispatch = useAppDispatch();

  const deletePageLines = (targets: cytoscape.EdgeSingular[]) => {
    const lineIds = targets
      .filter((target) => target.data("lineType") === "userDefined")
      .map((target) => target.data("lineId") as string);
    dispatch(removePageLines({ lineIds: [...new Set(lineIds)] }));
  };

  return {
    deletePageLines,
  };
};
