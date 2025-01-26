import clsx from "clsx";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";
import React, { memo, ReactNode } from "react";

export interface MenuItem {
  title: string | ReactNode;
  callback?:
    | ReactNode
    | ((event: {
        target: NodeSingular | EdgeSingular | null;
        cy: cytoscape.Core | undefined;
        position?: cytoscape.Position;
      }) => void);
  submenu?: MenuItem[];
  callbackOnHover?: boolean;
  restoreOnLeave?: () => void;
  divider?: boolean;
  disabled?: boolean;
  disableWhen?: (element: NodeSingular | EdgeSingular | cytoscape.Core) => boolean;
  hideWhen?: (element: NodeSingular | EdgeSingular | cytoscape.Core) => boolean;
  className?: string;
  onHover?: (event: {
    target: NodeSingular | EdgeSingular | null;
    cy: cytoscape.Core | undefined;
    position?: cytoscape.Position;
  }) => void;
}

interface ICytoscapeMenu {
  items: MenuItem[];
  isSubmenu?: boolean;
  leftMenu?: boolean;
  divider?: boolean;
  onItemClick: (item: MenuItem, shouldHideMenu?: boolean) => void;
  target: cytoscape.NodeSingular | cytoscape.EdgeSingular | null;
}

const CytoscapeMenu = ({ items, isSubmenu = false, leftMenu, onItemClick, target }: ICytoscapeMenu) => {
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
              e.preventDefault();
              if (item && !item.submenu && !item.disabled && isSimpleClickMenuItem) {
                onItemClick(item);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                if (item && !item.submenu && !item.disabled) {
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
              item.callbackOnHover && onItemClick(item, false);
              item.onHover && item.onHover({ target, cy: target?.cy() });
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              e.currentTarget.classList.remove("hovered");
              e.currentTarget.style.background = "none";
              e.currentTarget.style.cursor = "default";
              item.restoreOnLeave && item.restoreOnLeave();
            }}
          >
            <div className={clsx("menu-item-content", item.className)}>
              {React.isValidElement(item.callback) ? item.callback : item.title}
              {item.submenu && !item.disabled && <span className="submenu-indicator"></span>}
            </div>
            {item.submenu && !item.disabled && (
              <div className={clsx("submenu-container", { "push-left": leftMenu })}>
                <CytoscapeMenu
                  items={item.submenu}
                  isSubmenu={true}
                  leftMenu={leftMenu}
                  onItemClick={onItemClick}
                  target={target}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default memo(CytoscapeMenu);
