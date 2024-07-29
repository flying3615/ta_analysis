import { LuiButton, LuiIcon, LuiTooltip } from "@linzjs/lui";
import clsx from "clsx";
import { forwardRef, MouseEvent } from "react";

import { luiColors } from "@/constants";

interface HeaderButtonProps {
  headerButtonLabel: string;
  iconName: string;
  disabled?: boolean;
  isLoading?: boolean;
  selectedButtonLabel?: string;
  onClick?: (e: MouseEvent) => void | boolean;
  allowOpen?: () => boolean;
}

export const HeaderMenuButton = forwardRef<HTMLButtonElement, HeaderButtonProps>(function headerMenuButton(
  { disabled, headerButtonLabel, iconName, selectedButtonLabel, allowOpen, onClick },
  ref,
) {
  return (
    <>
      <LuiTooltip message={headerButtonLabel} placement="bottom" appendTo="parent">
        <LuiButton
          disabled={disabled}
          className={clsx("lui-button-menu", { selected: headerButtonLabel === selectedButtonLabel })}
          level="tertiary"
          style={{ whiteSpace: "nowrap" }}
          onClick={(e) => {
            if (allowOpen?.() === false) return;
            onClick?.(e);
          }}
          ref={ref}
        >
          <LuiIcon name={iconName} alt={headerButtonLabel} size="md" />
          <LuiIcon
            alt="Dropdown icon"
            className="HeaderToggle__dropdownIcon"
            color={luiColors.sea}
            name="ic_arrow_drop_down"
            size="md"
          />
        </LuiButton>
      </LuiTooltip>
    </>
  );
});
