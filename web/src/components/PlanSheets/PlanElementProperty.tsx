import "./PlanElementProperty.scss";

import { LuiButton, LuiFloatingWindow, LuiFloatingWindowContextProvider, LuiIcon } from "@linzjs/lui";
import React from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import LabelProperties, { LabelPropertiesProps } from "@/components/PlanSheets/properties/LabelProperties.tsx";
import LineProperties, { LinePropertiesProps } from "@/components/PlanSheets/properties/LineProperties.tsx";
import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { setPlanProperty } from "@/redux/planSheets/planSheetsSlice.ts";

export interface PlanElementData {
  [key: string]: string | number | boolean | undefined;
}
export type PlanElementPropertyMode = Extract<PlanMode, PlanMode.SelectLabel | PlanMode.SelectLine>;

export interface PlanPropertyPayload {
  mode: PlanElementPropertyMode;
  data: PlanElementData;
  position: { x: number; y: number };
}

export type PlanElementPropertyProps = {
  type: PlanPropertyPayload;
};

const planModeConfig = {
  [PlanMode.SelectLabel]: (data: PlanElementData) => ({
    component: <LabelProperties data={data as LabelPropertiesProps} />,
    headerContent: (
      <div className="header-container">
        <LuiIcon name="ic_format_lines_text" size="md" alt="Label properties" /> Label properties
      </div>
    ),
  }),
  [PlanMode.SelectLine]: (data: PlanElementData) => ({
    component: <LineProperties data={data as unknown as LinePropertiesProps} />,
    headerContent: (
      <div className="header-container">
        <LuiIcon name="ic_format_lines_text" size="md" alt="Line properties" /> Line properties
      </div>
    ),
  }),
};

const PlanElementProperty = ({ type }: PlanElementPropertyProps) => {
  const { component, headerContent } = planModeConfig[type.mode](type.data);
  const dispatch = useAppDispatch();

  const closeFloatingWindow = () => {
    dispatch(setPlanProperty(undefined));
  };

  return (
    <LuiFloatingWindowContextProvider>
      <div className="LuiFloatingWindow-overlay" />
      <LuiFloatingWindow
        leftSideHeader={headerContent}
        initialPosition={type.position}
        startWidth={200}
        startHeight={430}
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
