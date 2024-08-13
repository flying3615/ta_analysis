import "./Header.scss";

import { PropsWithChildren } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { Layer, zIndexes } from "@/components/DefineDiagrams/MapLayers";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";

import HeaderToggle, { ViewMode } from "./HeaderToggle";

export interface HeaderProps {
  view: ViewMode;
}

export const VerticalSpacer = () => <div className="vertical-spacer" />;

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
    <header className="Header" style={{ zIndex: zIndexes[Layer.HEADER] }}>
      <HeaderToggle onNavigate={handleNavigate} view={view} />
      <VerticalSpacer />
      {children}
    </header>
  );
};

export default Header;
