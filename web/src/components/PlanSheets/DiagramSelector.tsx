import "./DiagramSelector.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { LuiIcon } from "@linzjs/lui";

import { DiagramList } from "@/components/PlanSheets/DiagramList";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { luiColors } from "@/constants";
import { useAppSelector } from "@/hooks/reduxHooks";
import { getActiveSheet, getDiagrams } from "@/redux/planSheets/planSheetsSlice";

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
  const icons = {
    [PlanSheetType.SURVEY]: "ic_survey_sheet",
    [PlanSheetType.TITLE]: "ic_title_sheet",
  };

  const titles = {
    [PlanSheetType.SURVEY]: "Survey sheet diagrams",
    [PlanSheetType.TITLE]: "Title sheet diagrams",
  };

  return (
    <>
      <LuiIcon alt={`${titles[view]} icon`} color={luiColors.fuscous} name={icons[view]} size="md" />
      <h2>{titles[view]}</h2>
    </>
  );
};

const filterBySheetType = (view: PlanSheetType) => (d: DiagramDTO) => {
  const includesTravers = d.diagramType.includes("Traverse");
  if (view === PlanSheetType.SURVEY) {
    return includesTravers;
  } else if (view === PlanSheetType.TITLE) {
    return !includesTravers;
  } else {
    return false;
  }
};
