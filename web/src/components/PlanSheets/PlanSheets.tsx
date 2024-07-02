import "./PlanSheets.scss";
import Header from "@/components/Header/Header";
import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import { LuiIcon, LuiLoadingSpinner } from "@linzjs/lui";
import { luiColors } from "@/constants";
import SidePanel from "@/components/SidePanel/SidePanel";
import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { usePlanSheetState } from "@/components/PlanSheets/usePlanSheetState.ts";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useTransactionId } from "@/hooks/useTransactionId";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SheetToDiagramMap: Record<PlanSheetType, string> = {
  [PlanSheetType.SURVEY]: "sysGenTraverseDiag",
  [PlanSheetType.TITLE]: "sysGenPrimaryDiag",
};

const PlanSheets = () => {
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const { activeSheet, changeActiveSheet, diagramsPanelOpen, setDiagramsPanelOpen } = usePlanSheetState();

  const { data: planData, isLoading: planDataIsLoading, error: planDataError } = useGetPlanQuery({ transactionId });

  useEffect(() => {
    if (planDataError) {
      const serializedError = errorFromSerializedError(planDataError);
      newrelic.noticeError(serializedError);
      showPrefabModal(unhandledErrorModal(serializedError)).then(() => navigate(`/plan-generation/${transactionId}`));
    }
  }, [planDataError, transactionId, navigate, showPrefabModal]);

  if (planDataIsLoading || !planData) {
    return (
      <div ref={modalOwnerRef}>
        <Header view="Sheets" />
        <LuiLoadingSpinner />
      </div>
    );
  }

  const diagrams = planData.diagrams.filter((d) => d.diagramType === SheetToDiagramMap[activeSheet]);
  const nodeData = extractNodes(diagrams);
  const edgeData = extractEdges(diagrams);

  return (
    <>
      <Header view="Sheets" />
      <div className="PlanSheets" ref={modalOwnerRef}>
        <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
          <div className="PlanSheetsDiagramOptions">
            <div className="PlanSheetsDiagramOptions-heading">
              <LuiIcon alt="Survey sheet icon" color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
              <h2>Survey sheet diagrams</h2>
            </div>
          </div>
        </SidePanel>
        <CytoscapeCanvas nodeData={nodeData} edgeData={edgeData} diagrams={diagrams} />
      </div>
      <PlanSheetsFooter
        diagramsPanelOpen={diagramsPanelOpen}
        view={activeSheet}
        setDiagramsPanelOpen={setDiagramsPanelOpen}
        onChangeSheet={changeActiveSheet}
      />
    </>
  );
};

export default PlanSheets;
