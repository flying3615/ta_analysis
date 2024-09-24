import "./CytoscapeContextMenu.scss";

import cytoscape, { Core, EdgeSingular, EventObject, NodeSingular } from "cytoscape";
import React, { useEffect, useRef, useState } from "react";

import CytoscapeMenu from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";

export interface MenuItem {
  title: string;
  callback?: (event: { target: NodeSingular | EdgeSingular | null; cy: Core | undefined }) => void;
  submenu?: MenuItem[];
  subMenuIndicatorIcon?: string;
  isDisabled?: boolean;
}

interface ContextMenuProps {
  menuItems: MenuItem[];
  cy: cytoscape.Core | undefined;
}

const CytoscapeContextMenu = ({ menuItems, cy }: ContextMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [contextMenuItems, setContextMenuItems] = useState<MenuItem[]>([]);
  const [targetElement, setTargetElement] = useState<NodeSingular | EdgeSingular | null>(null);
  const [flipSubmenu, setFlipSubmenu] = useState<boolean>();

  const onCxtTap = (event: EventObject) => {
    event.preventDefault();
    event.stopPropagation();
    if (!cy) return;

    const cyContainerRect = cy.container()?.getBoundingClientRect();
    if (!cyContainerRect) return;

    const originalEvent = event.originalEvent as MouseEvent;
    let x = 0;
    let y = 0;
    const menuWidth = 150;
    const menuHeight = contextMenuItems.length * 30;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    setFlipSubmenu(false);
    if (originalEvent.clientX + menuWidth > screenWidth) {
      x = menuWidth;
      setFlipSubmenu(true);
    }
    if (originalEvent.clientY + menuHeight > screenHeight) {
      y = menuHeight + 5;
    }
    setContextMenuPosition({ x: originalEvent.clientX - x, y: originalEvent.clientY - y });
    setTargetElement(event.target !== cy ? (event.target as NodeSingular | EdgeSingular) : null);
    setContextMenuItems(menuItems);
  };

  const onTap = () => {
    setContextMenuPosition(null);
  };

  const onClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setContextMenuPosition(null);
    }
  };

  const onMenuItemClick = (item: MenuItem) => {
    item.callback?.({ target: targetElement, cy });
    setContextMenuPosition(null);
  };

  useEffect(() => {
    cy?.on("cxttap", onCxtTap);
    cy?.on("tap", onTap);

    return () => {
      cy?.removeListener("cxttap", onCxtTap);
      cy?.removeListener("tap", onTap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems, cy]);

  useEffect(() => {
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <>
      {contextMenuPosition && (
        <div
          ref={containerRef}
          className="cytoscape-context-menu-container"
          style={{
            position: "absolute",
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 1000,
          }}
        >
          <CytoscapeMenu items={menuItems} onItemClick={onMenuItemClick} flipSubmenuDir={flipSubmenu} />
        </div>
      )}
    </>
  );
};

export default CytoscapeContextMenu;
