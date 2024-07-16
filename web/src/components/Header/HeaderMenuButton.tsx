import { LuiButton, LuiIcon, LuiTooltip } from "@linzjs/lui";
import clsx from "clsx";
import { forwardRef, MouseEvent } from "react";

import { luiColors } from "@/constants";

interface HeaderButtonProps {
  headerButtonLabel: string;
  iconName: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  selectedButtonLabel?: string;
  onClick?: (e: MouseEvent) => void;
  setSelectedButtonLabel: (label: string) => void;
}

export const HeaderMenuButton = forwardRef<HTMLButtonElement, HeaderButtonProps>(function headerMenuButton(
  { isDisabled, headerButtonLabel, iconName, selectedButtonLabel, onClick, setSelectedButtonLabel },
  ref,
) {
  const handleHeaderButtonClick = () => {
    setSelectedButtonLabel(headerButtonLabel);
  };

  return (
    <>
      <LuiTooltip message={headerButtonLabel} placement="bottom" appendTo="parent">
        <LuiButton
          disabled={isDisabled}
          className={clsx("lui-button-menu", { selected: headerButtonLabel === selectedButtonLabel })}
          level="tertiary"
          style={{ whiteSpace: "nowrap" }}
          onClick={(e) => {
            handleHeaderButtonClick();
            typeof onClick === "function" && onClick(e);
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
