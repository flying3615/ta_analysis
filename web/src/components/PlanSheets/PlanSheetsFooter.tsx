import "./PlanSheetsFooter.scss";

import { LuiButton, LuiIcon } from "@linzjs/lui";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import React from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getActiveSheet, setActiveSheet } from "@/redux/planSheets/planSheetsSlice";

export interface FooterProps {
  diagramsPanelOpen: boolean;
  setDiagramsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PlanSheetsFooter = ({ diagramsPanelOpen, setDiagramsPanelOpen }: FooterProps) => {
  const dispatch = useAppDispatch();
  const view = useAppSelector((state) => getActiveSheet(state));
  const onChangeSheet = (sheet: PlanSheetType) => () => dispatch(setActiveSheet(sheet));

  return (
    <footer className="PlanSheetsFooter">
      <Menu
        menuButton={
          <LuiButton title="Change sheet view" className="lui-button-tertiary lui-button-icon">
            <LuiIcon
              alt={`${view} icon`}
              color={luiColors.sea}
              name={view === PlanSheetType.TITLE ? "ic_title_sheet" : "ic_survey_sheet"}
              size="md"
            />
            <LuiIcon alt="Dropdown icon" color={luiColors.sea} name="ic_arrow_drop_down" size="md" />
          </LuiButton>
        }
      >
        <MenuHeader className="change-sheet-header">Change sheet view</MenuHeader>
        <MenuItem disabled={view === PlanSheetType.TITLE} onClick={onChangeSheet(PlanSheetType.TITLE)}>
          <LuiIcon alt={`${view} icon`} color={luiColors.sea} name="ic_title_sheet" size="md" />
          Title sheet
        </MenuItem>
        <MenuItem disabled={view === PlanSheetType.SURVEY} onClick={onChangeSheet(PlanSheetType.SURVEY)}>
          <LuiIcon alt={`${view} icon`} color={luiColors.sea} name="ic_survey_sheet" size="md" />
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
    </footer>
  );
};

export default PlanSheetsFooter;
