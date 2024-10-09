import cytoscape, {
  CollectionReturnValue,
  EdgeSingular,
  EventObject,
  NodeSingular,
  SingularElementArgument,
} from "cytoscape";
import { useCallback, useEffect, useState } from "react";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { useEscapeKey } from "@/hooks/useEscape.ts";

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
  ) => MenuItem[] | undefined,
) => {
  useEscapeKey({ callback: () => hideMenu() });
  const [menuState, setMenuState] = useState<ContextMenuState>({
    items: [],
    position: { x: 0, y: 0 },
    target: null,
    visible: false,
  });
  const showMenu = useCallback((state: ContextMenuState) => {
    setMenuState({ ...state, visible: true });
  }, []);

  const hideMenu = useCallback(() => setMenuState((state) => ({ ...state, visible: false })), []);

  const onCxtTap = useCallback(
    (event: EventObject) => {
      if (!event.cy) return;

      const { clientX: x, clientY: y } = event.originalEvent;
      const target = event.target === event.cy ? null : (event.target as SingularElementArgument);

      if (!target) {
        if (event.cy.elements(":selected").length === 0) return;
      } else {
        if (!target.selected()) {
          event.cy.elements().unselect();
          target.select();
        }
      }

      const menuItems = getContextMenuItems(
        target as SingularElementArgument | cytoscape.Core,
        event.cy.elements(":selected"),
      );
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
    [getContextMenuItems, showMenu],
  );

  const onTap = useCallback(() => {
    hideMenu();
  }, [hideMenu]);

  useEffect(() => {
    cy?.on("cxttap", onCxtTap);
    document.addEventListener("click", hideMenu);

    return () => {
      cy?.removeListener("cxttap", onCxtTap);
      document.removeEventListener("click", hideMenu);
    };
  }, [cy, hideMenu, onCxtTap, onTap]);

  return { menuState, hideMenu };
};
