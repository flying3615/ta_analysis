import "./PlanSheets.scss";
import Header from "@/components/Header/Header";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import { LuiIcon, LuiLoadingSpinner } from "@linzjs/lui";
import { luiColors } from "@/constants";
import SidePanel from "@/components/SidePanel/SidePanel";
import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { fetchPlan, getDiagrams, getPlanError, isPlanFetching } from "@/redux/plan/planSlice.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { usePlanSheetState } from "@/components/PlanSheets/usePlanSheetState.ts";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import { useLuiModalPrefab } from "@linzjs/windows";

const SheetToDiagramMap: Record<PlanSheetType, string> = {
  [PlanSheetType.SURVEY]: "sysGenTraverseDiag",
  [PlanSheetType.TITLE]: "sysGenPrimaryDiag",
};

const PlanSheets = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const { activeSheet, changeActiveSheet, diagramsPanelOpen, setDiagramsPanelOpen } = usePlanSheetState();

  const diagrams = useAppSelector((state) =>
    getDiagrams(state).filter((d) => d.diagramType === SheetToDiagramMap[activeSheet]),
  );
  const nodeData = extractNodes(diagrams);
  const edgeData = extractEdges(diagrams);
  const planDataIsFetching = useAppSelector((state) => isPlanFetching(state));
  const planDataError = useAppSelector((state) => getPlanError(state));

  useEffect(() => {
    if (planDataError) {
      const serializedError = errorFromSerializedError(planDataError);
      newrelic.noticeError(serializedError);
      showPrefabModal(unhandledErrorModal(serializedError)).then(() => navigate(`/plan-generation/${transactionId}`));
    }
  }, [planDataError, transactionId, navigate, showPrefabModal]);

  useEffect(() => {
    transactionId && dispatch(fetchPlan(parseInt(transactionId)));
  }, [dispatch, transactionId]);

  if (planDataIsFetching) return <LuiLoadingSpinner />;

  return (
    <>
      <Header onNavigate={navigate} transactionId={transactionId} view="Sheets" />
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
