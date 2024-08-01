import { LuiButton, LuiIcon, LuiMenu, LuiMiniSpinner } from "@linzjs/lui";
import { IconName } from "@linzjs/lui/dist/components/LuiIcon/LuiIcon";
import { MenuHeader, MenuItem } from "@szhsin/react-menu";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { ActionMenuButton } from "@/components/Header/ActionMenuButton.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

interface ActionHeaderMenuItemProps {
  action: DefineDiagramsActionType;
  icon?: IconName;
  label: string;
  title: string;
}

interface ActionHeaderMenuProps {
  disabled?: boolean;
  isLoading?: boolean;
  icon?: IconName;
  title: string;
  options: ActionHeaderMenuItemProps[];
  allowOpen?: () => boolean;
}

export const ActionHeaderMenu = ({ options, disabled, icon, title, isLoading, allowOpen }: ActionHeaderMenuProps) => {
  const activeAction = useAppSelector(getActiveAction);
  const dispatch = useAppDispatch();
  const changeActiveAction = (action: DefineDiagramsActionType) => () => dispatch(setActiveAction(action));

  return (
    <>
      {isLoading ? (
        <LuiButton level="tertiary" className="loading-spinner__nested">
          <LuiMiniSpinner size={20} />
        </LuiButton>
      ) : (
        <>
          <LuiMenu
            menuButton={({ open }) => (
              <ActionMenuButton
                headerButtonLabel={title}
                iconName={icon ?? options[0]?.icon ?? "ic_" + options[0]?.action}
                disabled={disabled}
                selected={open || options.some((o) => o.action === activeAction)}
                allowOpen={allowOpen}
              />
            )}
          >
            <MenuHeader>{title}</MenuHeader>
            {options.map((o) => (
              <MenuItem key={o.action} onClick={changeActiveAction(o.action)}>
                <LuiIcon name={o.icon ?? "ic_" + o.action} alt={o.title} size="md" />
                {o.label}
              </MenuItem>
            ))}
          </LuiMenu>
        </>
      )}
    </>
  );
};
