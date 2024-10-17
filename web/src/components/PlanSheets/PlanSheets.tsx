import "./PlanSheets.scss";
import "@/components/MainWindow.scss";

import { ResponseError } from "@linz/survey-plan-generation-api-client";
import { LuiLoadingSpinner, LuiStatusSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas.tsx";
import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider.tsx";
import { NoPageMessage } from "@/components/Footer/NoPageMessage.tsx";
import Header from "@/components/Header/Header";
import { asyncTaskFailedErrorModal } from "@/components/modals/asyncTaskFailedErrorModal.tsx";
import { errorWithResponseModal } from "@/components/modals/errorWithResponseModal.tsx";
import {
  errorFromResponseError,
  errorFromSerializedError,
  unhandledErrorModal,
} from "@/components/modals/unhandledErrorModal.tsx";
import { PageLabelInput } from "@/components/PageLabelInput/PageLabelInput.tsx";
import { DiagramSelector } from "@/components/PlanSheets/DiagramSelector.tsx";
import { MoveDiagramToPageModal } from "@/components/PlanSheets/interactions/MoveDiagramToPageModal.tsx";
import PlanElementProperty from "@/components/PlanSheets/PlanElementProperty.tsx";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import SidePanel from "@/components/SidePanel/SidePanel";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useAsyncTaskHandler } from "@/hooks/useAsyncTaskHandler.ts";
import { usePlanSheetsContextMenu } from "@/hooks/usePlanSheetsContextMenu.tsx";
import { useTransactionId } from "@/hooks/useTransactionId";
import {
  selectActiveDiagramsEdgesAndNodes,
  selectActivePageEdgesAndNodes,
  selectPageConfigEdgesAndNodes,
} from "@/modules/plan/selectGraphData.ts";
import { useCreateAndMaintainLockQuery } from "@/queries/lock.ts";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { useRegeneratePlanMutation } from "@/queries/planRegenerate.ts";
import { useSurveyInfoQuery } from "@/queries/survey.ts";
import { getDiagramToMove, getPlanMode, getPlanProperty } from "@/redux/planSheets/planSheetsSlice.ts";

import { ElementHover } from "./interactions/ElementHover.tsx";
import { PageNumberTooltips } from "./interactions/PageNumberTooltips.tsx";
import { SelectDiagramHandler } from "./interactions/SelectDiagramHandler.tsx";
import { SelectElementHandler } from "./interactions/SelectElementHandler.tsx";
import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import { PlanSheetsHeaderButtons } from "./PlanSheetsHeaderButtons.tsx";

const PlanSheets = () => {
  const transactionId = useTransactionId();
  useCreateAndMaintainLockQuery();

  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const {
    data: activeDiagrams,
    edges: diagramEdgeData,
    nodes: diagramNodeData,
  } = useAppSelector(selectActiveDiagramsEdgesAndNodes);
  const { data: activePage, edges: pageEdgeData, nodes: pageNodeData } = useAppSelector(selectActivePageEdgesAndNodes);
  const { edges: pageConfigsEdgeData, nodes: pageConfigsNodeData } = useAppSelector(selectPageConfigEdgesAndNodes);

  const regeneratePlanMutation = useRegeneratePlanMutation(transactionId);
  const {
    isPending: isRegenerating,
    isSuccess: regenerateDoneOrNotNeeded,
    isError: regenerationHasFailed,
    error: regenerateApiError,
  } = useAsyncTaskHandler(regeneratePlanMutation);

  useEffect(() => {
    regeneratePlanMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (regenerationHasFailed) {
      void showPrefabModal(asyncTaskFailedErrorModal("Failed to regenerate plan")).then((retry) => {
        if (retry) {
          regeneratePlanMutation.mutate();
        } else {
          navigate(`/plan-generation/${transactionId}`);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenerationHasFailed, navigate, showPrefabModal]);

  useEffect(() => {
    void (async () => {
      if (regenerateApiError) {
        newrelic.noticeError(regenerateApiError);
        const modalContent =
          (regenerateApiError as ResponseError).response?.status === 404
            ? errorWithResponseModal({
                ...(await errorFromResponseError(regenerateApiError as ResponseError)),
                message: "Survey not found",
              })
            : unhandledErrorModal(regenerateApiError);
        return showPrefabModal(modalContent).then(() => navigate(`/plan-generation/${transactionId}`));
      }
    })();
  }, [regenerateApiError, transactionId, navigate, showPrefabModal]);

  const { data: surveyInfo, isLoading: surveyInfoIsLoading } = useSurveyInfoQuery({ transactionId });
  const getMenuItemsForPlanElement = usePlanSheetsContextMenu();
  const planMode = useAppSelector(getPlanMode);
  const planProperty = useAppSelector(getPlanProperty);
  const diagramToMove = useAppSelector(getDiagramToMove);
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
      void showPrefabModal(unhandledErrorModal(serializedError)).then(() =>
        navigate(`/plan-generation/${transactionId}`),
      );
    }
  }, [planDataError, transactionId, navigate, showPrefabModal]);

  if (
    planDataIsLoading ||
    !planData ||
    !regenerateDoneOrNotNeeded ||
    surveyInfoIsLoading ||
    !surveyInfo ||
    regenerationHasFailed
  ) {
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

  const nodeData = [...pageConfigsNodeData, ...diagramNodeData, ...pageNodeData];
  const edgeData = [...pageConfigsEdgeData, ...diagramEdgeData, ...pageEdgeData];

  let selectionSelector = "";
  let applyClasses;
  switch (planMode) {
    case PlanMode.SelectLabel:
      // TODO: remove this once SelectElementHandler updated for PlanMode.SelectLabel
      selectionSelector = "node[label][^symbolId]";
      applyClasses = { "node[label][^symbolId]": "selectable-label" };
      break;
  }

  return (
    <CytoscapeContextProvider>
      <div className="MainWindow">
        <Header view="Sheets">
          <PlanSheetsHeaderButtons />
        </Header>
        <div className="PlanSheets" ref={modalOwnerRef}>
          <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
            <DiagramSelector />
          </SidePanel>
          {activePage ? (
            <CytoscapeCanvas
              nodeData={nodeData}
              edgeData={edgeData}
              diagrams={activeDiagrams}
              getContextMenuItems={(element, selectedCollection) =>
                getMenuItemsForPlanElement(element, selectedCollection)
              }
              selectionSelector={selectionSelector}
              applyClasses={applyClasses}
              data-testid="MainCytoscapeCanvas"
            />
          ) : (
            <NoPageMessage />
          )}
          {[PlanMode.AddLabel, PlanMode.SelectLabel].includes(planMode) && <PageLabelInput />}
          {planMode === PlanMode.SelectDiagram && <SelectDiagramHandler />}
          {(planMode === PlanMode.SelectCoordinates || planMode === PlanMode.SelectLine) && (
            <SelectElementHandler mode={planMode} />
          )}
          {diagramToMove && <MoveDiagramToPageModal diagram={diagramToMove} />}
          {planProperty && <PlanElementProperty {...planProperty} />}
          <ElementHover />
          <PageNumberTooltips />
        </div>
        <PlanSheetsFooter
          surveyInfo={surveyInfo}
          diagramsPanelOpen={diagramsPanelOpen}
          setDiagramsPanelOpen={setDiagramsPanelOpen}
          pageConfigsNodeData={pageConfigsNodeData}
          pageConfigsEdgeData={pageConfigsEdgeData}
        />
      </div>
    </CytoscapeContextProvider>
  );
};

export default PlanSheets;
