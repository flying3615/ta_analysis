import "./SidePanel.scss";

import clsx from "clsx";

export interface SidePanelProps extends React.PropsWithChildren {
  align: "left" | "right";
  isOpen: boolean;
}

const SidePanel = ({ align, isOpen, children, ...baseProps }: SidePanelProps) => {
  return (
    <aside
      className={clsx("SidePanel", `SidePanel-${align}`, { "SidePanel-open": isOpen })}
      aria-hidden={!isOpen}
      {...baseProps}
    >
      {children}
    </aside>
  );
};

export default SidePanel;
