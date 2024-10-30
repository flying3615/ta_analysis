import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { LuiCheckboxInput, LuiRadioInput, LuiTextInput } from "@linzjs/lui";
import React, { useState } from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import lineSymbolSvgs from "@/components/PlanSheets/properties/lineSymbolSvgs";
import { useAppSelector } from "@/hooks/reduxHooks";
import { LineStyle } from "@/modules/plan/styling";
import { getActiveSheet } from "@/redux/planSheets/planSheetsSlice";

import { borderWidthOptions } from "./LabelPropertiesUtils";

export interface LinePropertiesProps {
  displayState: DisplayStateEnum;
  lineType: string;
  pointWidth: number;
  originalStyle: string;
}

const LineProperties = ({ data }: { data: LinePropertiesProps[] }) => {
  const initialDisplayState = data[0]?.displayState || DisplayStateEnum.display;
  const [displayState, setDisplayState] = useState<DisplayStateEnum>(initialDisplayState);
  const activeSheet = useAppSelector(getActiveSheet);

  const lineType = data[0]?.lineType ?? "observation";
  const [lineStyle, setLineStyle] = useState(data[0]?.originalStyle ?? LineStyle.SOLID);
  const [pointWidth, setPointWidth] = useState(data[0]?.pointWidth ?? 1.0);

  const lineStyles = [
    LineStyle.PECK_DOT1,
    LineStyle.DOUBLE_ARROW_1,
    LineStyle.ARROW1,
    LineStyle.PECK1,
    LineStyle.SOLID,
  ];

  const onVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayState(e.target.checked ? DisplayStateEnum.hide : DisplayStateEnum.display);
  };

  // render an SVG for a specific line type
  function renderLabelFor(lineStyle: string) {
    const svgContent = lineSymbolSvgs[lineStyle] || lineSymbolSvgs[LineStyle.SOLID] || "";
    const svg = "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);

    return (
      <div className="svg-container">
        <img src={svg} alt={lineStyle} className="svg-image" />
      </div>
    );
  }

  // get the display name for the line type
  function getLineTypeDisplayName(type: string) {
    switch (type) {
      case "observation":
        return "Observation from the survey";
      case "parcelBoundary":
        return "Parcel boundary not observed as part of this survey";
      case "ctAbuttal":
        return "CT boundary or abuttal";
      case "userDefined":
        return "User";
      default:
        return "Unknown line type";
    }
  }

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <LuiCheckboxInput
          value="false"
          label="Hide"
          onChange={onVisibilityChange}
          isDisabled={
            lineType !== "userDefined" &&
            (activeSheet === PlanSheetType.TITLE ||
              displayState === DisplayStateEnum.systemHide ||
              displayState === DisplayStateEnum.systemDisplay)
          }
          isChecked={displayState !== DisplayStateEnum.display && displayState !== DisplayStateEnum.systemDisplay}
        />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Type</span>
        <div title={getLineTypeDisplayName(lineType)}>
          <LuiTextInput
            label=""
            value={getLineTypeDisplayName(lineType)}
            inputProps={{ disabled: true }}
            onChange={() => false}
          />
        </div>
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Line style</span>
        <LuiRadioInput
          options={lineStyles}
          onChange={(e) => {
            setLineStyle(e.target.value);
          }}
          isOptionDisabled={() => lineType !== "userDefined"}
          selectedValue={lineStyle}
          renderLabelFor={renderLabelFor}
        />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Width (pts)</span>
        <LuiRadioInput
          options={borderWidthOptions.map((o) => o.value)}
          onChange={(e) => {
            setPointWidth(Number(e.target.value));
          }}
          isOptionDisabled={() => lineType !== "userDefined"}
          selectedValue={pointWidth.toString()}
        />
      </div>
    </div>
  );
};

export default LineProperties;
