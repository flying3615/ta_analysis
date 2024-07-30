import "./PlanSheets.scss";

import { LuiLoadingSpinner, LuiStatusSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import { prepareDatasetErrorModal } from "@/components/DefineDiagrams/prepareDatasetErrorModal.tsx";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import { useCheckAndRegeneratePlan } from "@/components/PlanSheets/checkAndRegeneratePlan.ts";
import { DiagramSelector } from "@/components/PlanSheets/DiagramSelector.tsx";
import SidePanel from "@/components/SidePanel/SidePanel";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageEdges,
  extractPageNodes,
} from "@/modules/plan/extractGraphData.ts";
import { reconstructDiagrams } from "@/modules/plan/reconstructDiagrams.ts";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { getActiveDiagrams, replaceDiagrams } from "@/redux/planSheets/planSheetsSlice.ts";

import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import PlanSheetsHeaderButtons from "./PlanSheetsHeaderButtons.tsx";

const PlanSheets = () => {
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const activeDiagrams = useAppSelector(getActiveDiagrams);

  const { isRegenerating, regenerateDoneOrNotNeeded, planCheckError, regeneratePlanError } =
    useCheckAndRegeneratePlan(transactionId);

  const {
    data: planData,
    isLoading: planDataIsLoading,
    error: planDataError,
  } = useGetPlanQuery({
    transactionId,
    enabled: regenerateDoneOrNotNeeded, // Don't fetch features until the dataset is prepared
  });

  useEffect(() => {
    if (planDataError) {
      const serializedError = errorFromSerializedError(planDataError);
      newrelic.noticeError(serializedError);
      showPrefabModal(unhandledErrorModal(serializedError)).then(() => navigate(`/plan-generation/${transactionId}`));
    }
  }, [planDataError, transactionId, navigate, showPrefabModal]);

  useEffect(() => {
    if (planCheckError) {
      const serializedError = errorFromSerializedError(planCheckError);
      newrelic.noticeError(serializedError);
      showPrefabModal(unhandledErrorModal(serializedError)).then(() => navigate(`/plan-generation/${transactionId}`));
    }
  }, [planCheckError, transactionId, navigate, showPrefabModal]);

  useEffect(() => {
    if (regeneratePlanError) {
      const serializedError = errorFromSerializedError(regeneratePlanError);
      newrelic.noticeError(serializedError);

      // We get a regeneratePlanError here if we delegated to regenerating a plan
      // and that caused an application error
      showPrefabModal(prepareDatasetErrorModal(regeneratePlanError)).then(() =>
        navigate(`/plan-generation/${transactionId}`),
      );
    }
  }, [regeneratePlanError, transactionId, navigate, showPrefabModal]);

  if (planDataIsLoading || !planData || isRegenerating) {
    return (
      <div ref={modalOwnerRef}>
        <Header view="Sheets" />
        {isRegenerating ? (
          <LuiStatusSpinner>
            <div className="PlanSheetsRegenText">
              Preparing survey and diagrams for Layout Plan Sheets.
              <br />
              This may take a few moments...
            </div>
          </LuiStatusSpinner>
        ) : (
          <LuiLoadingSpinner />
        )}
      </div>
    );
  }

  const pageConfigs = planData.configs?.[0]?.pageConfigs ?? [];
  const pageConfigsNodeData = extractPageNodes(pageConfigs);
  const pageConfigsEdgeData = extractPageEdges(pageConfigs);

  const diagramNodeData = extractDiagramNodes(activeDiagrams);
  const diagramEdgeData = extractDiagramEdges(activeDiagrams);

  const nodeData = [...pageConfigsNodeData, ...diagramNodeData];
  const edgeData = [...pageConfigsEdgeData, ...diagramEdgeData];

  const onCytoscapeChange = ({ nodeData, edgeData }: { nodeData: INodeData[]; edgeData: IEdgeData[] }) => {
    const reconstructedDiagrams = reconstructDiagrams(activeDiagrams, nodeData, edgeData);
    dispatch(replaceDiagrams(reconstructedDiagrams));
  };

  return (
    <>
      <Header view="Sheets">
        <PlanSheetsHeaderButtons />
      </Header>
      <div className="PlanSheets" ref={modalOwnerRef}>
        <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
          <DiagramSelector />
        </SidePanel>
        <CytoscapeCanvas
          nodeData={nodeData}
          edgeData={edgeData}
          diagrams={activeDiagrams}
          onChange={onCytoscapeChange}
          data-testid="MainCytoscapeCanvas"
        />
      </div>
      <PlanSheetsFooter diagramsPanelOpen={diagramsPanelOpen} setDiagramsPanelOpen={setDiagramsPanelOpen} />
    </>
  );
};

export default PlanSheets;
