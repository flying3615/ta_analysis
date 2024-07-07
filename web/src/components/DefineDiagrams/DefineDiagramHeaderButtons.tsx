import { LuiButton, LuiIcon, LuiMenu } from "@linzjs/lui";
import { MenuHeader, MenuItem } from "@szhsin/react-menu";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsActionType.ts";
import { luiColors } from "@/constants.tsx";
import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

export const DefineDiagramMenuButtons = () => {
  const dispatch = useAppDispatch();
  const changeActiveAction = (action: DefineDiagramsActionType) => () => dispatch(setActiveAction(action));

  return (
    <LuiMenu
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
  );
};
