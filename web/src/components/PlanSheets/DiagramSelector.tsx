import "./DiagramSelector.scss";

import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { LuiIcon } from "@linzjs/lui";

import { DiagramList } from "@/components/PlanSheets/DiagramList.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { getActiveSheet } from "@/redux/planSheets/planSheetsSlice.ts";

export const DiagramSelector = () => {
  const view = useAppSelector((state) => getActiveSheet(state));
  const transactionId = useTransactionId();
  const { data, isLoading } = useGetPlanQuery({ transactionId });
  if (isLoading || !data) {
    return <></>;
  }
  const diagrams = data.diagrams.filter(filterBySheetType(view));
  const header = headerForSheet(view);
  return (
    <div className="PlanSheetsDiagramOptions">
      <div className="PlanSheetsDiagramOptions-heading">
        <LuiIcon alt="Survey sheet icon" color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
        {header}
      </div>
      <DiagramList diagrams={diagrams} />
    </div>
  );
};

const headerForSheet = (view: PlanSheetType) => {
  switch (view) {
    case PlanSheetType.SURVEY:
      return <h2>Survey sheet diagrams</h2>;
    case PlanSheetType.TITLE:
      return <h2>Title sheet diagrams</h2>;
    default:
      return <></>;
  }
};

const filterBySheetType = (view: PlanSheetType) => (d: IDiagram) => {
  const includesTravers = d.diagramType.includes("Traverse");
  if (view === PlanSheetType.SURVEY) {
    return includesTravers;
  } else if (view === PlanSheetType.TITLE) {
    return !includesTravers;
  } else {
    return false;
  }
};
