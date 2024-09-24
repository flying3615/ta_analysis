import clsx from "clsx";
import React from "react";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeContextMenu.tsx";

interface MenuProps {
  items: MenuItem[];
  isSubmenu?: boolean;
  flipSubmenuDir?: boolean;
  onItemClick: (item: MenuItem) => void;
}

const CytoscapeMenu = ({ items, isSubmenu = false, flipSubmenuDir = false, onItemClick }: MenuProps) => {
  return (
    <ul className={clsx("cytoscape-context-menu", { submenu: isSubmenu })}>
      {items.map((item, index) => (
        <li
          key={index}
          className={clsx("cytoscape-context-menu-item", { disabled: item.isDisabled })}
          role="menuitem"
          aria-disabled={item.isDisabled}
          aria-haspopup={item.submenu ? "true" : "false"}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.submenu && !item.isDisabled) {
              onItemClick(item);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              if (!item.submenu && !item.isDisabled) {
                onItemClick(item);
              }
            }
          }}
          onMouseEnter={(e) => {
            if (!item.isDisabled) {
              e.currentTarget.classList.add("hover");
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove("hover");
          }}
        >
          <div className="menu-item-content">
            {item.title}
            {item.submenu && !item.isDisabled && <span className="submenu-indicator">▶</span>}
          </div>
          {item.submenu && !item.isDisabled && (
            <div className={clsx("submenu-container", { "push-left": flipSubmenuDir })}>
              <CytoscapeMenu items={item.submenu} isSubmenu={true} onItemClick={onItemClick} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default CytoscapeMenu;
