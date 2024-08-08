import { LuiButton, LuiIcon, LuiMiniSpinner, LuiTooltip } from "@linzjs/lui";
import { LuiButtonProps } from "@linzjs/lui/dist/components/LuiButton/LuiButton";
import clsx from "clsx";

import { PlanSheetMenuLabels } from "@/components/PlanSheets/PlanSheetType";

interface HeaderButtonProps {
  headerMenuLabel: PlanSheetMenuLabels;
  iconName: string;
  headerButtonLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  selectedButtonLabel?: string;
  onClick?: LuiButtonProps["onClick"];
}

export const HeaderButton = ({
  disabled,
  headerButtonLabel,
  iconName,
  headerMenuLabel,
  loading,
  selectedButtonLabel,
  onClick,
}: HeaderButtonProps) => {
  const button = (
    <LuiButton
      disabled={disabled}
      level="tertiary"
      onClick={loading ? () => {} : onClick}
      className={clsx("lui-button-icon-only", { selected: headerMenuLabel === selectedButtonLabel })}
    >
      <LuiIcon name={iconName} alt={headerMenuLabel} size="md" />
    </LuiButton>
  );

  return (
    <>
      {loading ? (
        <LuiButton level="tertiary" className="loading-spinner">
          <LuiMiniSpinner size={20} />
        </LuiButton>
      ) : (
        <>
          {headerButtonLabel ? (
            <LuiTooltip message={headerButtonLabel} placement="bottom" appendTo="parent">
              {button}
            </LuiTooltip>
          ) : (
            button
          )}
        </>
      )}
    </>
  );
};
