import clsx from "clsx";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";
import React, { memo, ReactNode } from "react";

export interface MenuItem {
  title: string | ReactNode;
  callback?: (event: { target: NodeSingular | EdgeSingular | null; cy: cytoscape.Core | undefined }) => void;
  submenu?: MenuItem[];
  divider?: boolean;
  disabled?: boolean;
  disableWhen?: (element: NodeSingular | EdgeSingular | cytoscape.Core) => boolean;
  hideWhen?: (element: NodeSingular | EdgeSingular | cytoscape.Core) => boolean;
  className?: string;
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
      {items.map((item, index) => {
        const isSimpleClickMenuItem = typeof item.title === "string";

        return (
          <li
            key={index}
            className={clsx("context-menu-item", { disabled: item.disabled, divider: item.divider })}
            role="menuitem"
            aria-disabled={item.disabled}
            aria-haspopup={item.submenu ? "true" : "false"}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.submenu && !item.disabled && isSimpleClickMenuItem) {
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
              e.stopPropagation();
              if (!item.disabled) {
                e.currentTarget.classList.add("hovered");

                if (isSimpleClickMenuItem) {
                  e.currentTarget.style.background = "#e2f3f7";
                  e.currentTarget.style.cursor = "pointer";
                }

                if (!isSimpleClickMenuItem) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.cursor = "default";
                }
              }
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              e.currentTarget.classList.remove("hovered");
              e.currentTarget.style.background = "none";
              e.currentTarget.style.cursor = "default";
            }}
          >
            <div className={clsx("menu-item-content", item.className)}>
              {item.title}
              {item.submenu && !item.disabled && <span className="submenu-indicator"></span>}
            </div>
            {item.submenu && !item.disabled && (
              <div className={clsx("submenu-container", { "push-left": leftMenu })}>
                <CytoscapeMenu items={item.submenu} isSubmenu={true} leftMenu={leftMenu} onItemClick={onItemClick} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default memo(CytoscapeMenu);
