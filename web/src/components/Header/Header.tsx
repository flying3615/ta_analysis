import "./Header.scss";

import { generatePath, useNavigate } from "react-router-dom";
import HeaderToggle from "./HeaderToggle";
import { Paths } from "@/Paths";
import { useTransactionId } from "@/hooks/useTransactionId";

export type ViewMode = "Diagrams" | "Sheets";

export interface HeaderProps {
  view: ViewMode;
}

const Header = ({ view }: HeaderProps) => {
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
    </header>
  );
};

export default Header;
