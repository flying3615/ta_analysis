import { LuiButton, LuiIcon, LuiMenu } from "@linzjs/lui";
import { MenuHeader, MenuItem } from "@szhsin/react-menu";

import { VerticalSpacer } from "@/components/Header/Header";
import { luiColors } from "@/constants";

const PlanSheetsHeaderButtons = () => {
  return (
    <>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_line_arc_reverse" alt="Line arc reverse" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_delete_forever" alt="Delete" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_pan_map_alt" alt="Pan map" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_zoom_out" alt="Zoom out" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_add" alt="Zoom in" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_zoom_previous" alt="Zoom previous" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_zoom_centre" alt="Zoom centre" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton className="lui-button-icon-only" level="tertiary" style={{ whiteSpace: "nowrap" }}>
            <LuiIcon name="ic_manage_labels" alt="Manage labels" size="md" />
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
        <MenuHeader>View labels</MenuHeader>
        {/* see https://www.figma.com/design/1BgaquDso4nMqlGAJ2bLdj/Plan-Generation-(Survey-Q)?node-id=0-1&t=w9XoSPwjxgkeJioP-0 */}
        <MenuItem>Dynamically gen list</MenuItem>
      </LuiMenu>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_view" alt="View" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_pointer_outlined" alt="Cursor" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_diagram" alt="Select diagram" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_label" alt="Select label" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_coordinates" alt="Select coordinates" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_line" alt="Select line" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_polygon_selection" alt="Select polygon" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_add_label" alt="Add label" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_add_line" alt="Add line" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_format_lines_text" alt="Format lines text" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_square_selection" alt="Select rectangle" size="md" />
      </LuiButton>
    </>
  );
};

export default PlanSheetsHeaderButtons;
