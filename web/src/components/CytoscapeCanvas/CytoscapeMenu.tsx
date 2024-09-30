import clsx from "clsx";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";
import React, { memo } from "react";

export interface MenuItem {
  title: string;
  callback?: (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => void;
  submenu?: MenuItem[];
  divider?: boolean;
  disabled?: boolean;
}

interface ICytoscapeMenu {
  items: MenuItem[];
  isSubmenu?: boolean;
  leftMenu?: boolean;
  divider?: boolean;
  onItemClick: (item: MenuItem) => void;
}

const CytoscapeMenu = ({ items, isSubmenu = false, leftMenu, onItemClick }: ICytoscapeMenu) => {
  return (
    <ul className={clsx("cytoscape-context-menu", { submenu: isSubmenu })}>
      {items.map((item, index) => (
        <li
          key={index}
          className={clsx("context-menu-item", { disabled: item.disabled, divider: item.divider })}
          role="menuitem"
          aria-disabled={item.disabled}
          aria-haspopup={item.submenu ? "true" : "false"}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.submenu && !item.disabled) {
              onItemClick(item);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              if (!item.submenu && !item.disabled) {
                onItemClick(item);
              }
            }
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.classList.add("hover");
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove("hover");
          }}
        >
          <div className="menu-item-content">
            {item.title}
            {item.submenu && !item.disabled && <span className="submenu-indicator"></span>}
          </div>
          {item.submenu && !item.disabled && (
            <div className={clsx("submenu-container", { "push-left": leftMenu })}>
              <CytoscapeMenu items={item.submenu} isSubmenu={true} leftMenu={leftMenu} onItemClick={onItemClick} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default memo(CytoscapeMenu);
