import "./PlanSheets.scss";

import { LuiIcon, LuiLoadingSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import SidePanel from "@/components/SidePanel/SidePanel";
import { luiColors } from "@/constants";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { getActiveDiagramType } from "@/redux/planSheets/planSheetsSlice.ts";

import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import PlanSheetsHeaderButtons from "./PlanSheetsHeaderButtons.tsx";

const PlanSheets = () => {
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const activeDiagramType = useAppSelector((state) => getActiveDiagramType(state));

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

  const diagrams = planData.diagrams.filter((d) => d.diagramType === activeDiagramType);
  const nodeData = extractNodes(diagrams);
  const edgeData = extractEdges(diagrams);

  return (
    <>
      <Header view="Sheets">
        <PlanSheetsHeaderButtons />
      </Header>
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
      <PlanSheetsFooter diagramsPanelOpen={diagramsPanelOpen} setDiagramsPanelOpen={setDiagramsPanelOpen} />
    </>
  );
};

export default PlanSheets;
