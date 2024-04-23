import "./Header.scss";

import { generatePath } from "react-router-dom";
import HeaderToggle from "./HeaderToggle";
import { Paths } from "@/Paths";

export type ViewMode = "Diagrams" | "Sheets";

interface HeaderProps {
  onNavigate: (url: string) => void;
  transactionId?: string;
  view: ViewMode;
}

const Header = ({ onNavigate, transactionId, view }: HeaderProps) => {
  const handleNavigate = (mode: ViewMode) => {
    switch (mode) {
      case "Diagrams":
        onNavigate(generatePath(Paths.defineDiagrams, { transactionId }));
        break;

      case "Sheets":
        onNavigate(generatePath(Paths.layoutPlanSheets, { transactionId }));
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
