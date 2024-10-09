import "./PlanSheets.scss";
import "@/components/MainWindow.scss";

import { ResponseError } from "@linz/survey-plan-generation-api-client";
import { LuiLoadingSpinner, LuiStatusSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas.tsx";
import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider.tsx";
import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
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
import { getMenuItemsForPlanElement } from "@/components/PlanSheets/PlanSheetsContextMenu.tsx";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import SidePanel from "@/components/SidePanel/SidePanel";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useAsyncTaskHandler } from "@/hooks/useAsyncTaskHandler.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import {
  selectActiveDiagramsEdgesAndNodes,
  selectActivePageEdgesAndNodes,
  selectPageConfigEdgesAndNodes,
} from "@/modules/plan/selectGraphData.ts";
import { updateDiagramsWithEdge, updateDiagramsWithNode, updatePagesWithNode } from "@/modules/plan/updatePlanData.ts";
import { useGetPlanQuery } from "@/queries/plan.ts";
import { useRegeneratePlanMutation } from "@/queries/planRegenerate.ts";
import { useSurveyInfoQuery } from "@/queries/survey.ts";
import {
  findMarkSymbol,
  getPlanMode,
  lookupSource,
  replaceDiagrams,
  replacePage,
} from "@/redux/planSheets/planSheetsSlice.ts";

import { ElementHover } from "./interactions/ElementHover.tsx";
import { PageNumberTooltips } from "./interactions/PageNumberTooltips.tsx";
import { SelectDiagramHandler } from "./interactions/SelectDiagramHandler.tsx";
import { PlanElementType } from "./PlanElementType.ts";
import PlanSheetsFooter from "./PlanSheetsFooter.tsx";
import { PlanSheetsHeaderButtons } from "./PlanSheetsHeaderButtons.tsx";

const PlanSheets = () => {
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const {
    data: activeDiagrams,
    edges: diagramEdgeData,
    nodes: diagramNodeData,
  } = useAppSelector(selectActiveDiagramsEdgesAndNodes);
  const { data: activePage, edges: pageEdgeData, nodes: pageNodeData } = useAppSelector(selectActivePageEdgesAndNodes);
  const { edges: pageConfigsEdgeData, nodes: pageConfigsNodeData } = useAppSelector(selectPageConfigEdgesAndNodes);

  const regeneratePlanMutationResult = useRegeneratePlanMutation(transactionId);
  const regeneratePlanMutate = () => regeneratePlanMutationResult.mutate();
  const {
    isPending: isRegenerating,
    isSuccess: regenerateDoneOrNotNeeded,
    isError: regenerationHasFailed,
    error: regenerateApiError,
  } = useAsyncTaskHandler(regeneratePlanMutationResult, regeneratePlanMutate);

  useEffect(() => {
    if (regenerationHasFailed) {
      void showPrefabModal(asyncTaskFailedErrorModal("Failed to regenerate plan")).then((retry) => {
        if (retry) {
          regeneratePlanMutate();
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
  const planMode = useAppSelector(getPlanMode);
  const lookupSelectors = {
    lookupSource: useAppSelector(lookupSource),
    findMarkSymbol: useAppSelector(findMarkSymbol),
  };

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

  const onNodeChange = (node: INodeData) => {
    if (node.properties["diagramId"]) {
      const updatedDiagrams = updateDiagramsWithNode(activeDiagrams, node);
      dispatch(replaceDiagrams(updatedDiagrams));
    } else {
      if (activePage) {
        const updatedPage = updatePagesWithNode(activePage, node);
        dispatch(replacePage(updatedPage));
      }
    }
  };
  const onEdgeChange = (edge: IEdgeData) => {
    const updatedDiagrams = updateDiagramsWithEdge(activeDiagrams, edge);
    dispatch(replaceDiagrams(updatedDiagrams));
  };

  let selectionSelector = "";
  let applyClasses;
  switch (planMode) {
    case PlanMode.SelectDiagram:
      selectionSelector = `node[elementType='${PlanElementType.DIAGRAM}']`;
      break;
    case PlanMode.SelectCoordinates:
      selectionSelector = "node[elementType='coordinates']";
      applyClasses = { ":parent": [], node: "node-selected" };
      break;
    case PlanMode.SelectLine:
      selectionSelector = "edge";
      break;
    case PlanMode.SelectLabel:
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
          <CytoscapeCanvas
            nodeData={nodeData}
            edgeData={edgeData}
            diagrams={activeDiagrams}
            onNodeChange={onNodeChange}
            onEdgeChange={onEdgeChange}
            getContextMenuItems={(element) => getMenuItemsForPlanElement(lookupSelectors, planMode, element)}
            selectionSelector={selectionSelector}
            applyClasses={applyClasses}
            data-testid="MainCytoscapeCanvas"
          />
          {planMode === PlanMode.AddLabel && <PageLabelInput />}
          {planMode === PlanMode.SelectDiagram && <SelectDiagramHandler diagrams={activeDiagrams} />}
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
