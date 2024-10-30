import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { removePageLabels } from "@/redux/planSheets/planSheetsSlice";

export const useDeleteLabels = () => {
  const dispatch = useAppDispatch();

  return (targets: cytoscape.NodeSingular[]) => {
    const labelIds = targets
      .filter((target) => target.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation)
      .map((target) => target.data("id") as string);
    dispatch(removePageLabels({ labelIds: [...new Set(labelIds)] }));
  };
};
