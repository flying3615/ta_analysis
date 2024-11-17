import "./HeaderToggle.scss";

import { LuiButton, LuiIcon } from "@linzjs/lui";
import { Menu, MenuDivider, MenuHeader, MenuItem } from "@szhsin/react-menu";
import { generatePath, useNavigate } from "react-router-dom";

import { luiColors } from "@/constants";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { navigateAfterSave } from "@/redux/planSheets/planSheetsSlice";
import { hostProtoForApplication } from "@/util/httpUtil";

export type ViewMode = "Diagrams" | "LandingPage" | "Sheets" | "Survey";

interface HeaderToggleProps {
  onNavigate: (mode: ViewMode) => void;
  view: ViewMode;
}

const HeaderToggle = ({ onNavigate, view }: HeaderToggleProps) => {
  const navigate = useNavigate();
  const transactionId = useTransactionId();
  const dispatch = useAppDispatch();
  const handleSurveyCaptureClick = () => {
    const externalUrl = `${hostProtoForApplication(8080)}/survey/${transactionId}`;
    if (view === "Sheets") {
      dispatch(navigateAfterSave(externalUrl));
    } else {
      window.location.href = externalUrl;
    }
  };
  return (
    <Menu
      className="HeaderToggle"
      menuButton={
        <LuiButton className="HeaderToggle__button lui-button-tertiary lui-button-icon">
          <LuiIcon
            alt={`${view} icon`}
            color={luiColors.sea}
            name={view === "Diagrams" ? "ic_define_diagrams" : "ic_layout_plan_sheets"}
            size="md"
          />
          {view}
          <LuiIcon
            alt="Dropdown icon"
            className="HeaderToggle__dropdownIcon"
            color={luiColors.sea}
            name="ic_arrow_drop_down"
            size="md"
          />
        </LuiButton>
      }
    >
      <MenuHeader>Switch mode</MenuHeader>
      <MenuItem
        disabled={view === "Diagrams"}
        onClick={() => navigate(generatePath(Paths.defineDiagrams, { transactionId }))}
      >
        <LuiIcon name="ic_define_diagrams" alt="Define Diagrams Icon" size="md" />
        Define Diagrams
      </MenuItem>
      <MenuItem disabled={view === "Sheets"} onClick={() => onNavigate("Sheets")}>
        <LuiIcon name="ic_layout_plan_sheets" alt="Layout Plan Sheets Icon" size="md" />
        Layout Plan Sheets
      </MenuItem>
      <MenuDivider />
      <MenuHeader>Return to</MenuHeader>
      <MenuItem onClick={() => onNavigate("LandingPage")}>
        <LuiIcon name="ic_parcels_new" alt="Landing Page Icon" size="md" />
        Landing Page
      </MenuItem>
      <MenuItem onClick={handleSurveyCaptureClick}>
        <LuiIcon name="ic_parcels_new" alt="Landing Page Icon" size="md" />
        Survey Capture
      </MenuItem>
    </Menu>
  );
};

export default HeaderToggle;
