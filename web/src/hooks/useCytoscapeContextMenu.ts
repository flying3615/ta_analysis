import cytoscape, {
  CollectionReturnValue,
  EdgeSingular,
  EventObject,
  NodeSingular,
  SingularElementArgument,
} from "cytoscape";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { useEscapeKey } from "@/hooks/useEscape";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

import { useEditContextMenu } from "./useEditContextMenu";

export interface ContextMenuState {
  visible?: boolean;
  items: MenuItem[];
  position: { x: number; y: number };
  target: NodeSingular | EdgeSingular | null;
  leftMenu?: boolean;
}

export const useCytoscapeContextMenu = (
  cy: cytoscape.Core | undefined,
  getContextMenuItems: (
    element: NodeSingular | EdgeSingular | cytoscape.Core,
    selectedCollection: CollectionReturnValue,
    clickedPosition: cytoscape.Position,
  ) => MenuItem[] | undefined,
) => {
  useEscapeKey({
    callback: () => hideMenu(),
  });
  const [menuState, setMenuState] = useState<ContextMenuState>({
    items: [],
    position: { x: 0, y: 0 },
    target: null,
    visible: false,
  });
  const showMenu = useCallback((state: ContextMenuState) => {
    setMenuState({ ...state, visible: true });
  }, []);

  // set selected elements into ref to restore them after closing the context menu
  const selectedElements = useRef<CollectionReturnValue>();
  selectedElements.current = cy?.elements(":selected");

  const container = cy?.container();
  const cytoCoordMapper = useMemo(() => (container ? new CytoscapeCoordinateMapper(container, []) : null), [container]);

  const diagramAreasLimits = useMemo(
    () => (cytoCoordMapper ? cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cy) : null),
    [cy, cytoCoordMapper],
  );

  const { buildEditMenuItems } = useEditContextMenu();

  const hideMenu = useCallback(() => setMenuState((state) => ({ ...state, visible: false })), []);

  const onCxtTap = useCallback(
    (event: EventObject) => {
      event.stopPropagation();
      if (!event.cy) return;

      const { clientX: x, clientY: y } = event.originalEvent;
      const target = event.target === cy ? null : (event.target as SingularElementArgument);

      let menuItems: MenuItem[] | undefined = undefined;
      if (
        diagramAreasLimits &&
        !cytoscapeUtils.isPositionWithinAreaLimits(event.position, [diagramAreasLimits.diagramOuterLimitsPx])
      ) {
        // clicked outside of diagram area
        return;
      }

      if (
        diagramAreasLimits &&
        cytoscapeUtils.isPositionWithinAreaLimits(event.position, [diagramAreasLimits.diagramOuterLimitsPx])
      ) {
        if (event.cy.elements(":selected").length === 0) {
          // click on empty space of diagram area, without selected
          menuItems = buildEditMenuItems(event.position);
        } else {
          // click on empty space of diagram area, with selected
          menuItems = getContextMenuItems(
            target as SingularElementArgument | cytoscape.Core,
            event.cy.elements(":selected"),
            event.position,
          );
        }
      }

      if (target) {
        // click on node or edge
        if (!target.selected()) {
          // unselect all and only make target selected
          event.cy.elements().unselect();
          target.select();
        }

        menuItems = getContextMenuItems(
          target as SingularElementArgument | cytoscape.Core,
          event.cy.elements(":selected"),
          event.position,
        );
      }

      if (!menuItems || menuItems.length === 0) return;

      const menuWidth = 150;
      const menuHeight = menuItems.length * 30;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const isLeftMenu = x + menuWidth > screenWidth;
      const adjustedX = x + menuWidth > screenWidth ? -menuWidth : 5;
      const adjustedY = y + menuHeight > screenHeight ? -menuHeight : 5;

      showMenu({
        items: menuItems,
        position: { x: x + adjustedX, y: y + adjustedY },
        target,
        leftMenu: isLeftMenu,
      });
    },
    [cy, getContextMenuItems, showMenu, diagramAreasLimits, buildEditMenuItems],
  );

  const onTap = useCallback(
    (event: EventObject) => {
      event.stopPropagation();

      hideMenu();
    },
    [hideMenu],
  );

  useEffect(() => {
    cy?.on("cxttap", onCxtTap);
    document.addEventListener("click", hideMenu);

    return () => {
      document.removeEventListener("click", hideMenu);
      cy?.removeListener("cxttap", onCxtTap);
    };
  }, [cy, hideMenu, onCxtTap, onTap]);

  return { menuState, hideMenu };
};
