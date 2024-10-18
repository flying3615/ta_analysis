import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { LuiCheckboxInput, LuiRadioInput, LuiTextInput } from "@linzjs/lui";
import React from "react";

import lineSymbolSvgs from "@/components/PlanSheets/properties/lineSymbolSvgs.ts";

export interface LinePropertiesProps {
  displayState: DisplayStateEnum;
  lineType: string;
  pointWidth: number;
  originalStyle: string;
}

const LineProperties = ({ data }: { data: LinePropertiesProps[] }) => {
  const elemt = data[0];
  if (!elemt) return;
  const {
    displayState = DisplayStateEnum.display,
    lineType = "observation",
    pointWidth = 1.0,
    originalStyle = "brokenSolid1",
  } = elemt;

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

  const invisible = displayState !== DisplayStateEnum.display && displayState !== DisplayStateEnum.systemDisplay;

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <LuiCheckboxInput value="false" label="Hide" onChange={() => {}} isDisabled={true} isChecked={invisible} />
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
