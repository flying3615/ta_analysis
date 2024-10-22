import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { LuiCheckboxInput, LuiRadioInput, LuiTextInput } from "@linzjs/lui";
import React, { useState } from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import lineSymbolSvgs from "@/components/PlanSheets/properties/lineSymbolSvgs";
import { useAppSelector } from "@/hooks/reduxHooks";
import { getActiveSheet } from "@/redux/planSheets/planSheetsSlice";

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
  const elem = data[0];
  if (!elem) return;
  const { lineType = "observation", pointWidth = 1.0, originalStyle = "brokenSolid1" } = elem;

  const onVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayState(e.target.checked ? DisplayStateEnum.hide : DisplayStateEnum.display);
  };

  // render an SVG for a specific line type
  function renderLabelFor() {
    const svgContent = lineSymbolSvgs[originalStyle] || lineSymbolSvgs["solid"] || "";
    const svg = "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);

    return (
      <div className="svg-container">
        <img src={svg} alt={originalStyle} className="svg-image" />
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
            activeSheet === PlanSheetType.TITLE ||
            displayState === DisplayStateEnum.systemHide ||
            displayState === DisplayStateEnum.systemDisplay
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
          options={[originalStyle]}
          isOptionDisabled={() => true}
          onChange={() => false}
          selectedValue={originalStyle}
          renderLabelFor={renderLabelFor}
        />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Width (pts)</span>
        <LuiRadioInput
          options={[pointWidth.toString()]}
          isOptionDisabled={() => true}
          onChange={() => false}
          selectedValue={pointWidth.toString()}
        />
      </div>
    </div>
  );
};

export default LineProperties;
