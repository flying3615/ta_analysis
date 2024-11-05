import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";

import { cytoscapeLabelIdToPlanData } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { removePageLabels } from "@/redux/planSheets/planSheetsSlice";

export const usePageLabelEdit = () => {
  const dispatch = useAppDispatch();

  const deletePageLabels = (targets: cytoscape.NodeSingular[]) => {
    const labelIds = targets
      .filter((target) => target.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation)
      .map((target) => cytoscapeLabelIdToPlanData(target.data("id") as string));
    dispatch(removePageLabels({ labelIds: [...new Set(labelIds)] }));
  };

  return {
    deletePageLabels,
  };
};
