import "./CytoscapeContextMenu.scss";

import React, { useRef } from "react";

import CytoscapeMenu, { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { ContextMenuState } from "@/hooks/useCytoscapeContextMenu";

interface IContextMenu {
  menuState: ContextMenuState;
  hideMenu: () => void;
}

export const CytoscapeContextMenu = ({ menuState, hideMenu }: IContextMenu) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { visible, items, position, leftMenu, target } = menuState;

  if (!visible) return null;

  const onItemClick = (item: MenuItem) => {
    const cyInstance = target?.cy?.();
    cyInstance && item.callback?.({ target: target, cy: cyInstance, position: position });
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
      <CytoscapeMenu items={items} leftMenu={leftMenu} onItemClick={onItemClick} target={target} />
    </div>
  );
};
