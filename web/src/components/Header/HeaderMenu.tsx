import { LuiButton, LuiMenu, LuiMiniSpinner } from "@linzjs/lui";
import { ReactNode, useRef } from "react";

import { HeaderMenuButton } from "./HeaderMenuButton";

interface HeaderMenuProps {
  children: ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  primaryButtonIcon: string;
  primaryButtonLabel: string;
  selectedButtonLabel?: string;
  setSelectedButtonLabel: (label: string) => void;
  allowOpen?: () => boolean;
}

export const HeaderMenu = ({
  children,
  disabled,
  primaryButtonIcon,
  primaryButtonLabel,
  isLoading,
  selectedButtonLabel,
  setSelectedButtonLabel,
  allowOpen,
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
              disabled={disabled}
              selectedButtonLabel={selectedButtonLabel}
              allowOpen={allowOpen}
              onClick={() => {
                setSelectedButtonLabel(primaryButtonLabel);
              }}
            />
          }
        >
          {children}
        </LuiMenu>
      )}
    </>
  );
};
