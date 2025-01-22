import { LuiButton, LuiIcon, LuiMiniSpinner, LuiTooltip } from "@linzjs/lui";
import { IconName } from "@linzjs/lui/dist/components/LuiIcon/LuiIcon";
import clsx from "clsx";
import React, { useCallback } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { GACategory, sendGAEvent } from "@/util/googleAnalyticsUtils";

interface ActionHeaderButtonProps {
  title: string;
  icon: IconName;
  action?: DefineDiagramsActionType;
  disabled?: boolean;
  href?: string;
  openInNewTab?: boolean;
  loading?: boolean;
  onClick?: (ev: React.MouseEvent) => void;
  className?: string;
  testid?: string;
  GAEvent?: boolean;
}

export const ActionHeaderButton = ({
  title,
  action,
  href,
  onClick,
  openInNewTab = false,
  className,
  icon,
  disabled,
  loading,
  testid,
  GAEvent,
}: ActionHeaderButtonProps) => {
  const activeAction = useAppSelector(getActiveAction);
  const dispatch = useAppDispatch();

  const changeActiveAction = useCallback(
    (action: DefineDiagramsActionType) => dispatch(setActiveAction(action)),
    [dispatch],
  );

  const onClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      action && changeActiveAction(action === activeAction ? "idle" : action);
      GAEvent && sendGAEvent(GACategory.DEFINE_DIAGRAMS, title);
      onClick?.(ev);
    },
    [GAEvent, action, activeAction, changeActiveAction, onClick, title],
  );

  const innerButton = (
    <div>
      <LuiButton
        disabled={disabled}
        level="tertiary"
        href={href}
        openInNewTab={openInNewTab}
        onClick={onClickHandler}
        data-testid={testid}
        className={clsx("lui-button-icon-only", className, { selected: action === activeAction })}
      >
        <LuiIcon name={icon} alt={title} size="md" />
      </LuiButton>
    </div>
  );

  return loading ? (
    <LuiButton level="tertiary" className="loading-spinner">
      <LuiMiniSpinner size={20} />
    </LuiButton>
  ) : title ? (
    <LuiTooltip message={title} placement="bottom" appendTo="parent">
      {innerButton}
    </LuiTooltip>
  ) : (
    innerButton
  );
};
