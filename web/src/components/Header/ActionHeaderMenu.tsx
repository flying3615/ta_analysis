import { LuiButton, LuiControlledMenu, LuiIcon, LuiMiniSpinner } from "@linzjs/lui";
import { IconName } from "@linzjs/lui/dist/components/LuiIcon/LuiIcon";
import { MenuHeader, MenuItem, MenuState } from "@szhsin/react-menu";
import { useEffect, useRef, useState } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { ActionMenuButton } from "@/components/Header/ActionMenuButton";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useConstFunction } from "@/hooks/useConstFunction";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";

interface ActionHeaderMenuItemProps {
  action: DefineDiagramsActionType;
  icon?: IconName;
  label: string;
  title: string;
  iconClassName?: string;
}

interface ActionHeaderMenuProps {
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  className?: string;
  title: string;
  options: ActionHeaderMenuItemProps[];
  allowOpen?: () => boolean;
  defaultAction?: DefineDiagramsActionType;
}

export const ActionHeaderMenu = ({
  options,
  disabled,
  defaultAction,
  icon,
  className,
  title,
  loading,
  allowOpen,
}: ActionHeaderMenuProps) => {
  const activeAction = useAppSelector(getActiveAction);
  const dispatch = useAppDispatch();
  const changeActiveAction = (action: DefineDiagramsActionType) => dispatch(setActiveAction(action));

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuState, setMenuState] = useState<MenuState>("closed");

  const clickHandlerForMenuLostFocus = useConstFunction((e: MouseEvent) => {
    setMenuState("closing");
    if (menuButtonRef.current?.contains(e.target as Node)) {
      changeActiveAction("idle");
    }
  });

  // We can't just close the menu immediately as it will trigger another open straight away
  useEffect(() => {
    menuState === "closing" && setMenuState("closed");
  }, [menuState]);

  // Hook into document click to close menu on lost focus
  useEffect(() => {
    if (menuState !== "open") return;
    document.addEventListener("mouseup", clickHandlerForMenuLostFocus);
    return () => {
      document.removeEventListener("mouseup", clickHandlerForMenuLostFocus);
    };
  }, [clickHandlerForMenuLostFocus, menuState]);

  const subActionIsSelected = options.some((o) => o.action === activeAction);

  return (
    <>
      {loading && subActionIsSelected ? (
        <LuiButton level="tertiary" className="loading-spinner__nested">
          <LuiMiniSpinner size={20} />
        </LuiButton>
      ) : (
        <>
          <ActionMenuButton
            ref={menuButtonRef}
            headerButtonLabel={title}
            iconName={icon ?? options[0]?.icon ?? "ic_" + options[0]?.action}
            disabled={disabled}
            selected={menuState === "open" || subActionIsSelected}
            allowOpen={allowOpen}
            className={className}
            onClick={() => {
              if (subActionIsSelected) {
                // Toggle menu off on click if active
                changeActiveAction("idle");
              } else if (menuState === "closed") {
                // open menu on click if not already open
                defaultAction && changeActiveAction(defaultAction);
                setMenuState("open");
              }
            }}
          />
          <LuiControlledMenu
            anchorRef={menuButtonRef}
            state={menuState}
            onBlur={(e) => {
              // Close the menu if tabbing away
              if (e.relatedTarget?.role !== "menuitem") {
                setMenuState("closed");
              }
            }}
          >
            <MenuHeader>{title}</MenuHeader>
            {options.map((o) => (
              <MenuItem
                key={o.action}
                onClick={() => {
                  changeActiveAction(o.action);
                  setMenuState("closed");
                }}
              >
                <LuiIcon
                  name={o.icon ?? "ic_" + o.action ?? "ic_menu"}
                  alt={o.title}
                  size="md"
                  className={o.iconClassName}
                />
                {o.label}
              </MenuItem>
            ))}
          </LuiControlledMenu>
        </>
      )}
    </>
  );
};
