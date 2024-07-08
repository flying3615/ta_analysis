import { LuiButton, LuiIcon, LuiMenu } from "@linzjs/lui";
import { MenuHeader, MenuItem } from "@szhsin/react-menu";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsActionType.ts";
import { VerticalSpacer } from "@/components/Header/Header";
import { luiColors } from "@/constants.tsx";
import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

export const DefineDiagramMenuButtons = () => {
  const dispatch = useAppDispatch();
  const changeActiveAction = (action: DefineDiagramsActionType) => () => dispatch(setActiveAction(action));

  return (
    <>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_delete_forever" alt="Delete" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_add" alt="Zoom in" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_zoom_out" alt="Zoom out" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_zoom_centre" alt="Zoom centre" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_rt_lines" alt="Select RT lines" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_add_rt_lines" alt="Add RT lines" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_draw_rt_bdry" alt="Draw RT boundary" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_draw_abuttal" alt="Draw abuttal" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_line" alt="Select line" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton
            className="lui-button-icon-only"
            level="tertiary"
            style={{ whiteSpace: "nowrap" }}
            title="Define primary diagram"
          >
            <LuiIcon name="ic_define_primary_diagram_rectangle" alt="Define primary diagram" size="md" />
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
        <MenuHeader>Define primary diagram</MenuHeader>
        <MenuItem>
          <LuiIcon name="ic_define_primary_diagram_rectangle" alt="Define primary diagram by rectangle" size="md" />
          Rectangle
        </MenuItem>
        <MenuItem>
          <LuiIcon name="ic_define_primary_diagram_polygon" alt="Define primary diagram by polygon" size="md" />
          Polygon
        </MenuItem>
      </LuiMenu>
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton
            className="lui-button-icon-only"
            level="tertiary"
            style={{ whiteSpace: "nowrap" }}
            title="Define non-primary diagram"
          >
            <LuiIcon name="ic_define_nonprimary_diagram_rectangle" alt="Define non-primary diagram" size="md" />
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
        <MenuHeader>Define non-primary diagram</MenuHeader>
        <MenuItem>
          <LuiIcon
            name="ic_define_nonprimary_diagram_rectangle"
            alt="Define non-primary diagram by rectangle"
            size="md"
          />
          Rectangle
        </MenuItem>
        <MenuItem>
          <LuiIcon name="ic_define_nonprimary_diagram_polygon" alt="Define non-primary diagram by polygon" size="md" />
          Polygon
        </MenuItem>
      </LuiMenu>
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton
            className="lui-button-icon-only"
            level="tertiary"
            style={{ whiteSpace: "nowrap" }}
            title="Define survey diagram"
          >
            <LuiIcon name="ic_define_survey_diagram_rectangle" alt="Define survey diagram rectangle" size="md" />
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
        <MenuHeader>Define survey diagram</MenuHeader>
        <MenuItem>
          <LuiIcon name="ic_define_survey_diagram_rectangle" alt="Define survey diagram by rectangle" size="md" />
          Rectangle
        </MenuItem>
        <MenuItem>
          <LuiIcon name="ic_define_survey_diagram_polygon" alt="Define survey diagram by polygon" size="md" />
          Polygon
        </MenuItem>
      </LuiMenu>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_select_diagram" alt="Select diagram" size="md" />
      </LuiButton>
      <LuiButton level="tertiary" onClick={() => alert("Not Yet Implemented")} className="lui-button-icon-only">
        <LuiIcon name="ic_label_diagrams" alt="Label diagrams" size="md" />
      </LuiButton>
      <VerticalSpacer />
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton className="lui-button-icon-only" level="tertiary" style={{ whiteSpace: "nowrap" }}>
            <LuiIcon name="ic_zoomin_snippet_rectangle" alt="Enlarge diagram" size="md" />
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
        <MenuHeader>Enlarge diagram</MenuHeader>
        <MenuItem onClick={changeActiveAction("enlarge_diagram_rectangle")}>
          <LuiIcon name="ic_zoomin_snippet_rectangle" alt="Enlarge by rectangle" size="md" />
          Rectangle
        </MenuItem>
        <MenuItem onClick={changeActiveAction("enlarge_diagram_polygon")}>
          <LuiIcon name="ic_zoomin_snippet_polygon" alt="Enlarge by polygon" size="md" />
          Polygon
        </MenuItem>
      </LuiMenu>
      <LuiMenu
        className="nestedButtonMenu"
        menuButton={
          <LuiButton className="lui-button-icon-only" level="tertiary" style={{ whiteSpace: "nowrap" }}>
            <LuiIcon name="ic_zoomout_snippet_rectangle" alt="Reduce diagram" size="md" />
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
        <MenuHeader>Reduce diagram</MenuHeader>
        <MenuItem>
          <LuiIcon name="ic_zoomout_snippet_rectangle" alt="Reduce by rectangle" size="md" />
          Rectangle
        </MenuItem>
        <MenuItem>
          <LuiIcon name="ic_zoomout_snippet_polygon" alt="Reduce by polygon" size="md" />
          Polygon
        </MenuItem>
      </LuiMenu>
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
    </>
  );
};
