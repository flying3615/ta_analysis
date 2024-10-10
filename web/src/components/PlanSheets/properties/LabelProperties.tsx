import React from "react";

export interface LabelPropertiesProps {
  visibility?: boolean;
  fontSize?: number;
  fontType?: string;
  textAngle?: number;
  justify?: "Left" | "Centre" | "Right";
  border?: boolean;
  labelAlignment?: string;
}

const LabelProperties = ({ data }: { data: LabelPropertiesProps }) => {
  const { visibility, fontSize, fontType, textAngle, justify, border, labelAlignment } = data;

  return (
    <div className="plan-element-properties">
      <div>
        <label htmlFor="label-visibility">Visibility</label>
        <input type="checkbox" name="visibility" checked={visibility} onChange={() => false} /> Hide
      </div>

      <div>
        <label htmlFor="label-font">Font</label>
        <select name="fontType" value={fontType} onChange={() => false}>
          <option value="Arial">Arial</option>
          <option value="Tahoma">Tahoma</option>
        </select>
        <input type="number" name="fontSize" value={fontSize} onChange={() => false} /> pts
      </div>

      <div>
        <label htmlFor="label-angle">Text angle (degrees)</label>
        <input type="number" name="textAngle" value={textAngle} onChange={() => false} />
      </div>

      <div className="justify-buttons">
        <button className={justify === "Left" ? "active" : ""} onClick={() => false}>
          Left
        </button>
        <button className={justify === "Centre" ? "active" : ""} onClick={() => false}>
          Centre
        </button>
        <button className={justify === "Right" ? "active" : ""} onClick={() => false}>
          Right
        </button>
      </div>

      <div>
        <label htmlFor="label-border">Border</label>
        <input type="checkbox" name="border" checked={border} onChange={() => false} /> Border
      </div>

      <div className="label-alignment">
        <label htmlFor="label-alignment">Label alignment</label>
        <div className="alignment-grid">{labelAlignment}</div>
      </div>
    </div>
  );
};

export default LabelProperties;
