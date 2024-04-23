import "./Header.scss";

import HeaderToggle from "./HeaderToggle";

interface HeaderProps {
  transactionId?: string;
  view: "Diagrams" | "Sheets";
}

const Header = ({ transactionId, view }: HeaderProps) => {
  return (
    <header className="Header">
      <HeaderToggle transactionId={transactionId} view={view} />
    </header>
  );
};

export default Header;
