import "./PlanSheetsFooter.scss";

import { LuiButton, LuiIcon, LuiMiniSpinner, useToast } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import React, { useEffect } from "react";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import FooterPagination from "@/components/Footer/FooterPagination";
import PageManager from "@/components/Footer/PageManager";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeCanvasExport } from "@/hooks/useCytoscapeCanvasExport.tsx";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { useTransactionId } from "@/hooks/useTransactionId";
import { useUpdatePlanMutation } from "@/queries/plan";
import { ExternalSurveyInfoDto } from "@/queries/survey.ts";
import {
  getActivePageNumber,
  getActiveSheet,
  getFilteredPages,
  setActivePageNumber,
  setActiveSheet,
} from "@/redux/planSheets/planSheetsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";

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
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  const { success: successToast } = useToast();

  const activeSheet = useAppSelector(getActiveSheet);
  const onChangeSheet = (sheet: PlanSheetType) => () => dispatch(setActiveSheet(sheet));

  const currentPage = useAppSelector(getActivePageNumber);
  const { totalPages } = useAppSelector(getFilteredPages);

  const { result: isPreviewCompilationOn } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_PREVIEW_COMPILATION);

  const { startProcessing, ExportingCanvas, processing } = useCytoscapeCanvasExport({
    transactionId,
    surveyInfo,
    pageConfigsNodeData,
    pageConfigsEdgeData,
  });

  const {
    mutate: updatePlanMutate,
    isSuccess: updatePlanIsSuccess,
    isPending: updatePlanIsPending,
    error: updatePlanError,
  } = useUpdatePlanMutation({ transactionId });
  const { result: saveEnabled, loading: saveEnabledLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_SAVE_LAYOUT,
  );

  const updatePlan = () => !updatePlanIsPending && updatePlanMutate();

  // Save upon pressing Ctrl+S
  useOnKeyDown(({ key, ctrlKey }) => ctrlKey && key === "s", updatePlan);

  useEffect(() => {
    if (updatePlanIsSuccess) {
      successToast("Layout saved successfully");
    }
  }, [updatePlanIsSuccess, successToast]);

  useEffect(() => {
    if (!updatePlanError) {
      return;
    }
    const serializedError = errorFromSerializedError(updatePlanError);
    newrelic.noticeError(serializedError);
    showPrefabModal(unhandledErrorModal(serializedError));
  }, [updatePlanError, showPrefabModal, transactionId]);

  const handlePageChange = (pageNumber: number) => () => {
    dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber: pageNumber }));
  };

  return (
    <footer className="PlanSheetsFooter" ref={modalOwnerRef}>
      {isPreviewCompilationOn && <ExportingCanvas />}
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
      <PageManager />

      <div className="PlanSheetsFooter-right">
        <LuiButton
          className="PlanSheetsFooter-saveButton lui-button-tertiary"
          onClick={updatePlan}
          disabled={!saveEnabled || saveEnabledLoading}
        >
          {updatePlanIsPending ? (
            <LuiMiniSpinner size={20} divProps={{ "data-testid": "update-plan-loading-spinner" }} />
          ) : (
            <>
              <LuiIcon alt="Save" color={luiColors.sea} name="ic_save" size="md" />
              Save layout
            </>
          )}
        </LuiButton>
        {isPreviewCompilationOn && (
          <LuiButton
            className="PlanSheetsFooter-previewButton lui-button-tertiary"
            onClick={() => startProcessing("PREVIEW")}
            disabled={processing}
          >
            {processing ? (
              <LuiMiniSpinner size={20} divProps={{ "data-testid": "preview-loading-spinner" }} />
            ) : (
              <>
                <LuiIcon alt="Save" color={luiColors.sea} name="ic_layout_plan_sheets" size="md" />
                Preview layout
              </>
            )}
          </LuiButton>
        )}

        <UnsavedChangesModal
          updatePlan={updatePlan}
          updatePlanIsPending={updatePlanIsPending}
          updatePlanIsSuccess={updatePlanIsSuccess}
        />
      </div>
    </footer>
  );
};

export default PlanSheetsFooter;
