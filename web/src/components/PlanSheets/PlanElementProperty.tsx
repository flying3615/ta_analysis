import "./PlanElementProperty.scss";

import { LuiButton, LuiFloatingWindow, LuiFloatingWindowContextProvider, LuiIcon } from "@linzjs/lui";
import React from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import LabelProperties, { LabelPropertiesProps } from "@/components/PlanSheets/properties/LabelProperties.tsx";
import LineProperties, { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties.tsx";
import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { setPlanProperty } from "@/redux/planSheets/planSheetsSlice.ts";

export type PlanElementPropertyMode = Extract<PlanMode, PlanMode.SelectLabel | PlanMode.SelectLine>;

interface PlanLabelProperty {
  mode: PlanMode.SelectLabel;
  data: LabelPropertiesProps;
  position: { x: number; y: number };
}

interface PlanLineProperty {
  mode: PlanMode.SelectLine;
  data: LinePropertiesProps;
  position: { x: number; y: number };
}

export type PlanPropertyPayload = PlanLabelProperty | PlanLineProperty;

const planModeConfig = ({ mode, data }: PlanPropertyPayload) => {
  switch (mode) {
    case PlanMode.SelectLabel:
      return {
        component: <LabelProperties {...data} />,
        headerContent: (
          <div className="header-container">
            <LuiIcon name="ic_format_lines_text" size="md" alt="Label properties" /> Label properties
          </div>
        ),
        startHeight: 685,
      };
    default:
      return {
        component: <LineProperties data={data} />,
        headerContent: (
          <div className="header-container">
            <LuiIcon name="ic_format_lines_text" size="md" alt="Line properties" /> Line properties
          </div>
        ),
        startHeight: 430,
      };
  }
};

const PlanElementProperty = (planElementProperty: PlanPropertyPayload) => {
  const { component, headerContent, startHeight } = planModeConfig(planElementProperty);
  const dispatch = useAppDispatch();

  const adjustPosition = (pos: { x: number; y: number }) => {
    const minSize = 600;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    return {
      x: pos.x + minSize > windowWidth ? windowWidth - minSize : pos.x,
      y: pos.y + minSize > windowHeight ? windowHeight - minSize : pos.y,
    };
  };

  const initialPosition = adjustPosition(planElementProperty.position);

  const closeFloatingWindow = () => {
    dispatch(setPlanProperty(undefined));
  };

  return (
    <LuiFloatingWindowContextProvider>
      <div className="LuiFloatingWindow-overlay" />
      <LuiFloatingWindow
        leftSideHeader={headerContent}
        initialPosition={initialPosition}
        startWidth={200}
        startHeight={startHeight}
        startDisplayed={true}
      >
        {component}
        <div className="footer">
          <LuiButton onClick={closeFloatingWindow} size="lg" level="tertiary">
            Cancel
          </LuiButton>
          <LuiButton disabled={true} size="lg" level="primary">
            Ok
          </LuiButton>
        </div>
      </LuiFloatingWindow>
    </LuiFloatingWindowContextProvider>
  );
};

export default PlanElementProperty;
