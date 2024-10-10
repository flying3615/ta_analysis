import { LuiCheckboxInput, LuiRadioInput, LuiTextInput } from "@linzjs/lui";
import React from "react";

import lineSymbolSvgs from "@/components/PlanSheets/properties/lineSymbolSvgs.ts";

export interface LinePropertiesProps {
  lineType: string;
  pointWidth: number;
  originalStyle: string;
}

const LineProperties = ({ data }: { data: LinePropertiesProps }) => {
  const { lineType = "observation", pointWidth = 1.0, originalStyle = "brokenSolid1" } = data;

  // render an SVG for a specific line type
  function renderLabelFor() {
    const svg = "data:image/svg+xml;utf8," + encodeURIComponent(lineSymbolSvgs[originalStyle] ?? "");

    return (
      <div className="svg-container">
        <img src={svg} alt={originalStyle} className="svg-image" />
      </div>
    );
  }

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <LuiCheckboxInput value="false" label="Hide" onChange={() => {}} isChecked={false} />
      </div>
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Type</span>
        <LuiTextInput label="" value={lineType} inputProps={{ disabled: true }} onChange={() => false} />
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
