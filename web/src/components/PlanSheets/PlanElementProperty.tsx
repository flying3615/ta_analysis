import "./PlanElementProperty.scss";

import { LuiButton } from "@linzjs/lui";
import { Panel, PanelContent, PanelHeader, PanelInstanceContext } from "@linzjs/windows";
import React, { useContext } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import LabelProperties, { LabelPropertiesProps } from "@/components/PlanSheets/properties/LabelProperties.tsx";
import LineProperties, { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { getPlanProperty, setPlanProperty } from "@/redux/planSheets/planSheetsSlice.ts";

export type PlanElementPropertyMode = Extract<PlanMode, PlanMode.SelectLabel | PlanMode.SelectLine>;

interface PlanLabelProperty {
  mode: PlanMode.SelectLabel;
  data: LabelPropertiesProps[];
  position: { x: number; y: number };
}

interface PlanLineProperty {
  mode: PlanMode.SelectLine;
  data: LinePropertiesProps[];
  position: { x: number; y: number };
}

export type PlanPropertyPayload = PlanLabelProperty | PlanLineProperty;

const planModeConfig = ({ mode, data }: PlanPropertyPayload) => {
  switch (mode) {
    case PlanMode.SelectLabel:
      return {
        component: <LabelProperties data={data} />,
        headerContent: {
          icon: "ic_format_lines_text",
          title: "Label properties",
        },
        startHeight: 705,
      };
    default:
      return {
        component: <LineProperties data={data} />,
        headerContent: {
          icon: "ic_format_lines_text",
          title: "Line properties",
        },
        startHeight: 430,
      };
  }
};

const PlanElementProperty = () => {
  const dispatch = useAppDispatch();
  const planElementProperty = useAppSelector(getPlanProperty);
  const { component, headerContent, startHeight } = planModeConfig(planElementProperty as PlanPropertyPayload);
  const maxPanelWidth: number = 320;
  const { panelClose } = useContext(PanelInstanceContext);

  if (!planElementProperty) return;

  // Adjusts the position to ensure it fits within the window's height.
  const adjustPosition = (pos: { x: number; y: number }) => {
    const windowHeight = window.innerHeight;
    const newHeight = startHeight + 100;
    return {
      x: pos.x,
      y: pos.y + newHeight > windowHeight ? windowHeight - newHeight : pos.y,
    };
  };
  const closeFloatingWindow = () => {
    dispatch(setPlanProperty(undefined));
    panelClose();
  };
  const initialPosition = adjustPosition(planElementProperty.position);

  return (
    <Panel
      title={headerContent.title}
      size={{ width: maxPanelWidth, height: startHeight }}
      position={initialPosition}
      maxWidth={maxPanelWidth}
      minWidth={maxPanelWidth}
      className="PlanElement-container"
      modal={true}
    >
      <PanelHeader icon={headerContent.icon} disablePopout={true} />
      <PanelContent>
        {component}
        <div className="footer">
          <LuiButton onClick={closeFloatingWindow} size="lg" level="tertiary">
            Cancel
          </LuiButton>
          <LuiButton disabled={true} size="lg" level="primary">
            OK
          </LuiButton>
        </div>
      </PanelContent>
    </Panel>
  );
};

export default PlanElementProperty;
