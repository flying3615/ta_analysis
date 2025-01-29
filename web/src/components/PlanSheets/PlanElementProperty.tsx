import "./PlanElementProperty.scss";

import { LuiButton } from "@linzjs/lui";
import { Panel, PanelContent, PanelHeader, PanelInstanceContext } from "@linzjs/windows";
import React, { useContext, useState } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import LabelProperties, { LabelPropertiesData } from "@/components/PlanSheets/properties/LabelProperties";
import LineProperties, { LinePropertiesData } from "@/components/PlanSheets/properties/LineProperties";
import { useEscapeKey } from "@/hooks/useEscape";

export type PlanPropertyPayload = PlanLabelProperty | PlanLineProperty;

interface PlanElementPropertyProps {
  property: PlanPropertyPayload;
  cy: cytoscape.Core;
  keepElementSelected: (callback: () => void) => void;
}

interface PlanLabelProperty {
  mode: PlanMode.SelectLabel;
  data: LabelPropertiesData[];
  position: { x: number; y: number };
}

interface PlanLineProperty {
  mode: PlanMode.SelectLine;
  data: LinePropertiesData[];
  position: { x: number; y: number };
}

const PlanElementProperty = ({ property, keepElementSelected, cy }: PlanElementPropertyProps) => {
  const [saveFunction, setSaveFunction] = useState<() => void>();
  const [isSaveEnabled, setSaveEnabled] = useState<boolean>(false);
  const { panelClose } = useContext(PanelInstanceContext);

  useEscapeKey({ callback: () => keepElementSelected(() => panelClose()) });

  const planModeConfig = ({ mode, data }: PlanPropertyPayload) => {
    switch (mode) {
      case PlanMode.SelectLabel:
        return {
          component: (
            <LabelProperties data={data} setSaveFunction={setSaveFunction} setSaveEnabled={setSaveEnabled} cyto={cy} />
          ),
          headerContent: {
            icon: "ic_format_lines_text",
            title: "Label properties",
          },
          startHeight: 705,
        };
      default:
        return {
          component: <LineProperties data={data} setSaveFunction={setSaveFunction} setSaveEnabled={setSaveEnabled} />,
          headerContent: {
            icon: "ic_format_lines_text",
            title: "Line properties",
          },
          startHeight: data.some((line) => line.lineType !== "userDefined") ? 435 : 715,
        };
    }
  };

  const { component, headerContent, startHeight } = planModeConfig(property);
  const minPanelHeight: number = 400;
  const maxPanelWidth: number = 320;

  // Adjusts the position to ensure it fits within the window's height.
  const adjustPosition = (pos: { x: number; y: number }) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const newWidth = maxPanelWidth + 20;
    const newHeight = startHeight + 100;
    return {
      x: pos.x + newWidth > windowWidth ? windowWidth - newWidth : pos.x,
      y: pos.y + newHeight > windowHeight ? windowHeight - newHeight : pos.y,
    };
  };

  const initialPosition = adjustPosition(property.position);

  return (
    <Panel
      title={headerContent.title}
      size={{ width: maxPanelWidth, height: startHeight }}
      position={initialPosition}
      maxWidth={maxPanelWidth}
      minWidth={maxPanelWidth}
      minHeight={minPanelHeight}
      className="PlanElement-container"
      modal={true}
    >
      <PanelHeader icon={headerContent.icon} disablePopout={true} />
      <PanelContent>{component}</PanelContent>
      <div className="footer">
        <LuiButton onClick={panelClose} size="lg" level="tertiary">
          Cancel
        </LuiButton>
        <LuiButton
          disabled={!isSaveEnabled}
          size="lg"
          level="primary"
          onClick={() =>
            keepElementSelected(() => {
              if (saveFunction) {
                saveFunction();
                panelClose();
              }
            })
          }
        >
          OK
        </LuiButton>
      </div>
    </Panel>
  );
};

export default PlanElementProperty;
