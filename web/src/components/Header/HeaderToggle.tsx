import "./HeaderToggle.scss";

import { LuiButton, LuiIcon } from "@linzjs/lui";
import { Menu, MenuItem } from "@szhsin/react-menu";

import { luiColors } from "@/constants";

export type ViewMode = "Diagrams" | "Sheets";

interface HeaderToggleProps {
  onNavigate: (mode: ViewMode) => void;
  view: ViewMode;
}

const HeaderToggle = ({ onNavigate, view }: HeaderToggleProps) => (
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
    <MenuItem disabled={view === "Diagrams"} onClick={() => onNavigate("Diagrams")}>
      Define Diagrams
    </MenuItem>
    <MenuItem disabled={view === "Sheets"} onClick={() => onNavigate("Sheets")}>
      Layout Plan Sheets
    </MenuItem>
  </Menu>
);

export default HeaderToggle;
