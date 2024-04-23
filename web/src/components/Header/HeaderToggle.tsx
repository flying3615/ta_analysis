import "./HeaderToggle.scss";

import { Paths } from "@/Paths";
import { LuiButton, LuiIcon } from "@linzjs/lui";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { generatePath, useNavigate } from "react-router-dom";

const colourSea = "#007198";

interface HeaderToggleProps {
  transactionId?: string;
  view: "Diagrams" | "Sheets";
}

const HeaderToggle = ({ transactionId, view }: HeaderToggleProps) => {
  const navigate = useNavigate();

  return (
    <Menu
      className="HeaderToggle"
      menuButton={
        <LuiButton className="HeaderToggle__button lui-button-tertiary lui-button-icon">
          <LuiIcon
            alt={`${view} icon`}
            color={colourSea}
            name={view === "Diagrams" ? "ic_define_diagrams" : "ic_layout_plan_sheets"}
            size="md"
          />
          {view}
          <LuiIcon
            alt="Dropdown icon"
            className="HeaderToggle__dropdownIcon"
            color={colourSea}
            name="ic_arrow_drop_down"
            size="md"
          />
        </LuiButton>
      }
    >
      <MenuItem onClick={() => navigate(generatePath(Paths.defineDiagrams, { transactionId }))}>
        Define diagrams
      </MenuItem>
      <MenuItem onClick={() => navigate(generatePath(Paths.layoutPlanSheets, { transactionId }))}>
        Layout Plan Sheets
      </MenuItem>
    </Menu>
  );
};

export default HeaderToggle;
