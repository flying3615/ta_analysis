import "./PlanSheetsFooter.scss";

import { LuiButton, LuiIcon, LuiMiniSpinner, useToast } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import React, { useEffect } from "react";

import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { useTransactionId } from "@/hooks/useTransactionId";
import { useUpdatePlanMutation } from "@/queries/plan";
import { getActiveSheet, setActiveSheet } from "@/redux/planSheets/planSheetsSlice";

export interface FooterProps {
  diagramsPanelOpen: boolean;
  setDiagramsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PlanSheetsFooter = ({ diagramsPanelOpen, setDiagramsPanelOpen }: FooterProps) => {
  const transactionId = useTransactionId();
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  const { success: successToast } = useToast();

  const activeSheet = useAppSelector(getActiveSheet);
  const onChangeSheet = (sheet: PlanSheetType) => () => dispatch(setActiveSheet(sheet));

  const {
    mutate: updatePlanMutate,
    isSuccess: updatePlanIsSuccess,
    isPending: updatePlanIsPending,
    error: updatePlanError,
  } = useUpdatePlanMutation({ transactionId });

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

  return (
    <footer className="PlanSheetsFooter" ref={modalOwnerRef}>
      <Menu
        menuButton={
          <LuiButton title="Change sheet view" className="lui-button-tertiary lui-button-icon">
            <LuiIcon
              alt={`${activeSheet} icon`}
              color={luiColors.sea}
              name={activeSheet === PlanSheetType.TITLE ? "ic_title_sheet" : "ic_survey_sheet"}
              size="md"
            />
            <LuiIcon alt="Dropdown icon" color={luiColors.sea} name="ic_arrow_drop_down" size="md" />
          </LuiButton>
        }
      >
        <MenuHeader className="change-sheet-header">Change sheet view</MenuHeader>
        <MenuItem disabled={activeSheet === PlanSheetType.TITLE} onClick={onChangeSheet(PlanSheetType.TITLE)}>
          <LuiIcon alt={`${activeSheet} icon`} color={luiColors.sea} name="ic_title_sheet" size="md" />
          Title sheet
        </MenuItem>
        <MenuItem disabled={activeSheet === PlanSheetType.SURVEY} onClick={onChangeSheet(PlanSheetType.SURVEY)}>
          <LuiIcon alt={`${activeSheet} icon`} color={luiColors.sea} name="ic_survey_sheet" size="md" />
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

      <div className="PlanSheetsFooter-right">
        <LuiButton className="PlanSheetsFooter-saveButton lui-button-tertiary" onClick={updatePlan}>
          {updatePlanIsPending ? (
            <LuiMiniSpinner
              size={18}
              divProps={{
                "data-testid": "update-plan-loading-spinner",
                style: {
                  display: "flex",
                  width: "24px",
                  height: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            />
          ) : (
            <LuiIcon alt="Save" color={luiColors.sea} name="ic_save" size="md" />
          )}
          Save layout
        </LuiButton>
      </div>
    </footer>
  );
};

export default PlanSheetsFooter;
