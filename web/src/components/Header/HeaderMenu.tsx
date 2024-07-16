import { LuiButton, LuiMenu, LuiMiniSpinner } from "@linzjs/lui";
import { ReactNode, useRef } from "react";

import { HeaderMenuButton } from "./HeaderMenuButton";

interface HeaderMenuProps {
  children: ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  primaryButtonIcon: string;
  primaryButtonLabel: string;
  selectedButtonLabel?: string;
  setSelectedButtonLabel: (label: string) => void;
}

export const HeaderMenu = ({
  children,
  isDisabled,
  primaryButtonIcon,
  primaryButtonLabel,
  isLoading,
  selectedButtonLabel,
  setSelectedButtonLabel,
}: HeaderMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      {isLoading ? (
        <LuiButton level="tertiary" className="loading-spinner__nested">
          <LuiMiniSpinner size={20} />
        </LuiButton>
      ) : (
        <LuiMenu
          menuButton={
            <HeaderMenuButton
              ref={buttonRef}
              headerButtonLabel={primaryButtonLabel}
              iconName={primaryButtonIcon}
              isDisabled={isDisabled}
              selectedButtonLabel={selectedButtonLabel}
              setSelectedButtonLabel={setSelectedButtonLabel}
            />
          }
        >
          {children}
        </LuiMenu>
      )}
    </>
  );
};
