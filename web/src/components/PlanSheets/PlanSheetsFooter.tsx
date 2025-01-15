import "./PlanSheetsFooter.scss";

import { LuiButton, LuiIcon, LuiMiniSpinner, LuiModalV2, LuiTooltip, useToast } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import FooterPagination from "@/components/Footer/FooterPagination";
import PageManager from "@/components/Footer/PageManager";
import { asyncTaskFailedErrorModal } from "@/components/modals/asyncTaskFailedErrorModal";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { luiColors } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useAsyncTaskHandler } from "@/hooks/useAsyncTaskHandler";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { clearRecoveryFile } from "@/hooks/usePlanAutoRecover";
import { usePlanGenCompilation } from "@/hooks/usePlanGenCompilation";
import { usePlanGenPreview } from "@/hooks/usePlanGenPreview";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { getPlanQueryKey, useUpdatePlanMutation } from "@/queries/plan";
import { ExternalSurveyInfoDto } from "@/queries/survey";
import {
  clearUndo,
  getActivePageNumber,
  getActiveSheet,
  getFilteredPages,
  hasChanges,
  setActivePageNumber,
  setActiveSheet,
} from "@/redux/planSheets/planSheetsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";

import { UnsavedChangesModal } from "./UnsavedChangesModal";

export interface FooterProps {
  surveyInfo: ExternalSurveyInfoDto;
  diagramsPanelOpen: boolean;
  setDiagramsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pageConfigsNodeData?: INodeData[];
  pageConfigsEdgeData?: IEdgeData[];
}

const PlanSheetsFooter = ({
  surveyInfo,
  diagramsPanelOpen,
  setDiagramsPanelOpen,
  pageConfigsNodeData,
  pageConfigsEdgeData,
}: FooterProps) => {
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  const { success: successToast } = useToast();
  const hasUnsavedChanges = useAppSelector(hasChanges);

  const activeSheet = useAppSelector(getActiveSheet);
  const onChangeSheet = (sheet: PlanSheetType) => () => dispatch(setActiveSheet(sheet));

  const currentPage = useAppSelector(getActivePageNumber);
  const { totalPages } = useAppSelector(getFilteredPages);
  const { zoomToFit } = useCytoscapeContext();

  const { result: isPreviewCompilationOn } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_PREVIEW_COMPILATION);

  const { startPreview, PreviewExportCanvas, previewing } = usePlanGenPreview({
    transactionId,
    surveyInfo,
    pageConfigsNodeData,
    pageConfigsEdgeData,
  });

  const { startCompile, CompilationExportCanvas, compiling } = usePlanGenCompilation({
    pageConfigsNodeData,
    pageConfigsEdgeData,
  });

  const updatePlanMutation = useUpdatePlanMutation(transactionId);
  const {
    isSuccess: updatePlanIsSuccess,
    isPending: updatePlanAsyncIsPending,
    isError: updatePlanHasFailed,
    isInterrupted: updatePlanIsInterrupted,
    error: updatePlanError,
    reset: updatePlanReset,
  } = useAsyncTaskHandler(updatePlanMutation);
  const updatePlanIsPending = updatePlanMutation.isPending || updatePlanAsyncIsPending;
  const updatePlan = () => !updatePlanIsPending && updatePlanMutation.mutate();
  const closePlan = () => navigate(generatePath(Paths.root, { transactionId }));

  // Save upon pressing Ctrl+S
  useOnKeyDown(({ key, ctrlKey }) => ctrlKey && key === "s", updatePlan);

  useEffect(() => {
    if (updatePlanIsSuccess) {
      void clearRecoveryFile(transactionId);
      void queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
      successToast("Layout saved successfully");
      dispatch(clearUndo()); // Clear undo history after saving, you can't undo save
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePlanIsSuccess]);

  useEffect(() => {
    if (updatePlanHasFailed) {
      void showPrefabModal(asyncTaskFailedErrorModal("Failed to save plan")).then((retry) => retry && updatePlan());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePlanHasFailed]);

  useEffect(() => {
    if (updatePlanIsInterrupted) {
      void showPrefabModal(asyncTaskFailedErrorModal("Layout save interrupted")).then((retry) => retry && updatePlan());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePlanIsInterrupted]);

  useEffect(() => {
    if (!updatePlanError) {
      return;
    }
    const serializedError = errorFromSerializedError(updatePlanError);
    newrelic.noticeError(serializedError);
    void showPrefabModal(unhandledErrorModal(serializedError));
  }, [updatePlanError, showPrefabModal, transactionId]);

  const handlePageChange = (pageNumber: number) => () => {
    dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber: pageNumber }));
    zoomToFit();
  };

  const CompileButton = () => {
    const button = (
      <LuiButton
        className="PlanSheetsFooter-compile-button lui-button-tertiary"
        onClick={() => {
          void startCompile();
        }}
        disabled={compiling || hasUnsavedChanges}
      >
        {compiling ? (
          <LuiMiniSpinner size={20} divProps={{ "data-testid": "compilation-loading-spinner" }} />
        ) : (
          <>
            <LuiIcon alt="" color={luiColors.sea} name="ic_double_tick" size="md" />
            Compile plan(s)
          </>
        )}
      </LuiButton>
    );

    return hasUnsavedChanges ? (
      <LuiTooltip placement="top" message="You must save your changes before you can compile the plans">
        <div>{button}</div>
      </LuiTooltip>
    ) : (
      button
    );
  };

  return (
    <footer className="PlanSheetsFooter" ref={modalOwnerRef}>
      {isPreviewCompilationOn && <PreviewExportCanvas />}
      {isPreviewCompilationOn && <CompilationExportCanvas />}
      <Menu
        menuButton={
          <LuiButton title="Change sheet view" className="change-sheet-button lui-button-tertiary lui-button-icon">
            <LuiIcon
              alt={`${activeSheet} icon`}
              color={luiColors.fuscous}
              name={activeSheet === PlanSheetType.TITLE ? "ic_title_sheet" : "ic_survey_sheet"}
              size="md"
            />
            <LuiIcon alt="Dropdown icon" color={luiColors.fuscous} name="ic_arrow_drop_down" size="md" />
          </LuiButton>
        }
      >
        <MenuHeader className="change-sheet-header">Change sheet view</MenuHeader>
        <MenuItem
          disabled={activeSheet === PlanSheetType.TITLE}
          onClick={onChangeSheet(PlanSheetType.TITLE)}
          className="PlanSheetFooterMenuItem"
        >
          <LuiIcon alt={`${activeSheet} icon`} color={luiColors.fuscous} name="ic_title_sheet" size="md" />
          Title sheet
        </MenuItem>
        <MenuItem
          disabled={activeSheet === PlanSheetType.SURVEY}
          onClick={onChangeSheet(PlanSheetType.SURVEY)}
          className="PlanSheetFooterMenuItem"
        >
          <LuiIcon alt={`${activeSheet} icon`} color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
          Survey sheet
        </MenuItem>
      </Menu>

      <LuiButton
        className="lui-button-icon lui-button-icon-only lui-button-tertiary"
        title="Toggle diagrams panel"
        buttonProps={{ "aria-pressed": diagramsPanelOpen }}
        onClick={() => setDiagramsPanelOpen(!diagramsPanelOpen)}
      >
        <LuiIcon alt="Toggle diagrams icon" color={luiColors.sea} name="ic_open_diagrams" size="md" />
      </LuiButton>

      <div className="vertical-spacer" />

      <FooterPagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="vertical-spacer" />

      <PageManager />

      <div className="PlanSheetsFooter-right">
        <LuiButton className="PlanSheetsFooter-close-button lui-button-tertiary" onClick={() => void closePlan()}>
          <>
            <LuiIcon alt="" color={luiColors.sea} name="ic_clear" size="md" />
            Close layout
          </>
        </LuiButton>
        <LuiButton className="PlanSheetsFooter-save-button lui-button-tertiary" onClick={updatePlan}>
          {updatePlanIsPending ? (
            <LuiMiniSpinner size={20} divProps={{ "data-testid": "update-plan-loading-spinner" }} />
          ) : (
            <>
              <LuiIcon alt="" color={luiColors.sea} name="ic_save" size="md" />
              Save layout
            </>
          )}
        </LuiButton>
        {isPreviewCompilationOn && (
          <LuiButton
            className="PlanSheetsFooter-preview-button lui-button-tertiary"
            onClick={() => void startPreview()}
            disabled={previewing}
          >
            {previewing ? (
              <LuiMiniSpinner size={20} divProps={{ "data-testid": "preview-loading-spinner" }} />
            ) : (
              <>
                <LuiIcon alt="" color={luiColors.sea} name="ic_layout_plan_sheets" size="md" />
                Preview layout
              </>
            )}
          </LuiButton>
        )}

        {isPreviewCompilationOn && <CompileButton />}

        <UnsavedChangesModal
          updatePlan={updatePlan}
          updatePlanIsPending={updatePlanIsPending}
          updatePlanIsSuccess={updatePlanIsSuccess}
          updatePlanReset={updatePlanReset}
        />
        {updatePlanIsPending && (
          <LuiModalV2
            headingText="Layout saving..."
            isLoading={true}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
          >
            Please wait for this to finish saving, as it may take a little bit longer than expected.
          </LuiModalV2>
        )}
      </div>
    </footer>
  );
};

export default PlanSheetsFooter;
