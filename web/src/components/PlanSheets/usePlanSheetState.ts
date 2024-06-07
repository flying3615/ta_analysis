import { useState } from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";

export const usePlanSheetState = () => {
  const [activeSheet, setActiveSheet] = useState<PlanSheetType>(PlanSheetType.TITLE);
  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const changeActiveSheet = (sheet: PlanSheetType) => () => setActiveSheet(sheet);

  return {
    activeSheet,
    changeActiveSheet,
    diagramsPanelOpen,
    setDiagramsPanelOpen,
  };
};
