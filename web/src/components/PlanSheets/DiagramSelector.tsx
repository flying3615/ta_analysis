import "./DiagramSelector.scss";

import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { LuiIcon } from "@linzjs/lui";

import { DiagramList } from "@/components/PlanSheets/DiagramList.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { getActiveSheet, getDiagrams } from "@/redux/planSheets/planSheetsSlice.ts";

export const DiagramSelector = () => {
  const view = useAppSelector(getActiveSheet);
  const diagrams = useAppSelector(getDiagrams).filter(filterBySheetType(view));
  const header = headerForSheet(view);
  return (
    <div className="PlanSheetsDiagramOptions">
      <div className="PlanSheetsDiagramOptions-heading">{header}</div>
      <DiagramList diagrams={diagrams} />
    </div>
  );
};

const headerForSheet = (view: PlanSheetType) => {
  switch (view) {
    case PlanSheetType.SURVEY:
      return (
        <>
          <LuiIcon alt="Survey sheet icon" color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
          <h2>Survey sheet diagrams</h2>
        </>
      );
    case PlanSheetType.TITLE:
      return (
        <>
          <LuiIcon alt="Title sheet icon" color={luiColors.fuscous} name="ic_title_sheet" size="md" />
          <h2>Title sheet diagrams</h2>
        </>
      );
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
