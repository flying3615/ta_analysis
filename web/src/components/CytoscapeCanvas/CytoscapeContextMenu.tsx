import "./CytoscapeContextMenu.scss";

import React, { useRef } from "react";

import CytoscapeMenu, { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { ContextMenuState } from "@/hooks/useCytoscapeContextMenu.ts";

interface IContextMenu {
  menuState: ContextMenuState;
  hideMenu: () => void;
}

export const CytoscapeContextMenu = ({ menuState, hideMenu }: IContextMenu) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { visible, items, position, leftMenu } = menuState;

  if (!visible) return null;

  const onItemClick = (item: MenuItem) => {
    const cyInstance = menuState.target?.cy?.();
    cyInstance && item.callback?.({ target: menuState.target, cy: cyInstance, position: position });
    hideMenu();
  };

  return (
    <div
      ref={containerRef}
      data-testid="cytoscapeContextMenu"
      className="cytoscape-context-menu-container"
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        zIndex: 1000,
      }}
    >
      <CytoscapeMenu items={items} leftMenu={leftMenu} onItemClick={onItemClick} />
    </div>
  );
};
