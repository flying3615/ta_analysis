import "./PlanSheets.scss";
import "@/components/MainWindow.scss";

import { ResponseError } from "@linz/survey-plan-generation-api-client";
import { LuiLoadingSpinner, LuiStatusSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import { NoPageMessage } from "@/components/Footer/NoPageMessage";
import Header from "@/components/Header/Header";
import { asyncTaskFailedErrorModal } from "@/components/modals/asyncTaskFailedErrorModal";
import { errorWithResponseModal } from "@/components/modals/errorWithResponseModal";
import {
  errorFromResponseError,
  errorFromSerializedError,
  unhandledErrorModal,
} from "@/components/modals/unhandledErrorModal";
import { AddPageLineHandler } from "@/components/PageLine/AddPageLineHandler";
import { DiagramSelector } from "@/components/PlanSheets/DiagramSelector";
import { MoveDiagramToPageModal } from "@/components/PlanSheets/interactions/MoveDiagramToPageModal";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import SidePanel from "@/components/SidePanel/SidePanel";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useAsyncTaskHandler } from "@/hooks/useAsyncTaskHandler";
import { usePlanAutoRecover } from "@/hooks/usePlanAutoRecover";
import { usePlanSheetsContextMenu } from "@/hooks/usePlanSheetsContextMenu";
import { useTransactionId } from "@/hooks/useTransactionId";
import {
  selectActiveDiagramsEdgesAndNodes,
  selectActivePageEdgesAndNodes,
  selectPageConfigEdgesAndNodes,
} from "@/modules/plan/selectGraphData";
import { useGetPlanQuery } from "@/queries/plan";
import { useRegeneratePlanMutation } from "@/queries/planRegenerate";
import { useSurveyInfoQuery } from "@/queries/survey";
import {
  getCanViewHiddenLabels,
  getDiagramIdToMove,
  getPlanMode,
  getViewableLabelTypes,
} from "@/redux/planSheets/planSheetsSlice";
import { filterEdgeData, filterNodeData } from "@/util/cytoscapeUtil";

import { AddLabelHandler } from "./interactions/AddLabelHandler";
import { DeleteKeyHandler } from "./interactions/DeleteKeyHandler";
import { ElementHover } from "./interactions/ElementHover";
import { PageNumberTooltips } from "./interactions/PageNumberTooltips";
import { SelectDiagramHandler } from "./interactions/SelectDiagramHandler";
import { SelectElementHandler } from "./interactions/SelectElementHandler";
import { SelectLabelHandler } from "./interactions/SelectLabelHandler";
import PlanSheetsFooter from "./PlanSheetsFooter";
import { PlanSheetsHeaderButtons } from "./PlanSheetsHeaderButtons";
import { SurveyDetails } from "./SurveyDetails";

const PlanSheets = () => {
  const transactionId = useTransactionId();
  const canViewHiddenLabels = useAppSelector(getCanViewHiddenLabels);
  const viewableLabelTypes = useAppSelector(getViewableLabelTypes);

  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);
  const [labelTextInputOpen, setLabelTextInputOpen] = useState<boolean>(false);

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

  const { data: surveyInfo } = useSurveyInfoQuery({ transactionId });
  const getMenuItemsForPlanElement = usePlanSheetsContextMenu();
  const planMode = useAppSelector(getPlanMode);
  const diagramIdToMove = useAppSelector(getDiagramIdToMove);

  const {
    data: planData,
    error: planDataError,
    // could block UI while loading after save
    // isFetching: isPlanDataFetching,
  } = useGetPlanQuery({
    transactionId,
    enabled: regenerateDoneOrNotNeeded, // Don't fetch features until the dataset is prepared
  });
  const isPlanDataReady = usePlanAutoRecover(transactionId, planData);

  useEffect(() => {
    if (planDataError) {
      const serializedError = errorFromSerializedError(planDataError);
      newrelic.noticeError(serializedError);
      void showPrefabModal(unhandledErrorModal(serializedError)).then(() =>
        navigate(`/plan-generation/${transactionId}`),
      );
    }
  }, [planDataError, transactionId, navigate, showPrefabModal]);

  const nodeData = useMemo(() => {
    const data = [...pageConfigsNodeData, ...diagramNodeData, ...pageNodeData];
    return filterNodeData(data, canViewHiddenLabels ? "" : "hide", viewableLabelTypes);
  }, [pageConfigsNodeData, diagramNodeData, pageNodeData, canViewHiddenLabels, viewableLabelTypes]);
  const edgeData = useMemo(
    () =>
      filterEdgeData([...pageConfigsEdgeData, ...diagramEdgeData, ...pageEdgeData], canViewHiddenLabels ? "" : "hide"),
    [pageConfigsEdgeData, diagramEdgeData, pageEdgeData, canViewHiddenLabels],
  );

  if (!isPlanDataReady || !surveyInfo) {
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

  return (
    <CytoscapeContextProvider>
      <div className="MainWindow">
        <Header view="Sheets">
          <PlanSheetsHeaderButtons />
        </Header>
        <div className="PlanSheets" ref={modalOwnerRef}>
          <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
            <SurveyDetails surveyInfo={surveyInfo} />
            <DiagramSelector />
          </SidePanel>
          {activePage ? (
            <CytoscapeCanvas
              nodeData={nodeData}
              edgeData={edgeData}
              diagrams={activeDiagrams}
              getContextMenuItems={(element, selectedCollection, clickedPosition) =>
                getMenuItemsForPlanElement(element, clickedPosition, selectedCollection)
              }
              data-testid="MainCytoscapeCanvas"
            />
          ) : (
            <NoPageMessage />
          )}
          {planMode === PlanMode.AddLabel && <AddLabelHandler />}
          {planMode === PlanMode.SelectLabel && <SelectLabelHandler setLabelTextInputOpen={setLabelTextInputOpen} />}
          {planMode === PlanMode.AddLine && <AddPageLineHandler />}
          {planMode === PlanMode.SelectDiagram && <SelectDiagramHandler />}
          {(planMode === PlanMode.SelectCoordinates ||
            planMode === PlanMode.SelectLine ||
            planMode === PlanMode.SelectLabel ||
            planMode === PlanMode.SelectTargetLine) && <SelectElementHandler mode={planMode} />}
          {(planMode === PlanMode.SelectLine || planMode === PlanMode.SelectLabel) && (
            <DeleteKeyHandler mode={planMode} labelTextInputOpen={labelTextInputOpen} />
          )}
          {diagramIdToMove && <MoveDiagramToPageModal diagramId={diagramIdToMove} />}
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
