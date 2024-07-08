import "./Header.scss";

import { PropsWithChildren } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";

import HeaderToggle from "./HeaderToggle";

export type ViewMode = "Diagrams" | "Sheets";

export interface HeaderProps {
  view: ViewMode;
}

export const VerticalSpacer = () => <div className="verticalSpacer" />;

const Header = ({ view, children }: PropsWithChildren<HeaderProps>) => {
  const navigate = useNavigate();
  const transactionId = useTransactionId();

  const handleNavigate = (mode: ViewMode) => {
    switch (mode) {
      case "Diagrams":
        navigate(generatePath(Paths.defineDiagrams, { transactionId }));
        break;

      case "Sheets":
        navigate(generatePath(Paths.layoutPlanSheets, { transactionId }));
        break;

      default:
        break;
    }
  };

  return (
    <header className="Header">
      <HeaderToggle onNavigate={handleNavigate} view={view} />
      <VerticalSpacer />
      {children}
    </header>
  );
};

export default Header;
