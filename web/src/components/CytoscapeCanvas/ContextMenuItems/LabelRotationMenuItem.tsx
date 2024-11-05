import "./LabelRotationMenuItem.scss";

import { NodeSingular } from "cytoscape";
import { useState } from "react";

import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { convertToDegrees } from "@/util/stringUtil";

// Match with Legacy, 90 degrees is horizontal, left-most/counter-clockwise extent is 0, right-most/clockwise extent is 180
const ANTI_CLOCKWISE_MAX = 0;
const CLOCKWISE_MAX = 180;

export const LabelRotationMenuItem = (props: { targetLabel: NodeSingular }) => {
  const { updateActiveDiagramsAndPageFromCytoData } = usePlanSheetsDispatch();

  const currentAngle = (props.targetLabel.style("text-rotation") as string) ?? "0";
  const [labelAngle, setLabelAngle] = useState<number>(Math.round(convertToDegrees(currentAngle)));

  return (
    <div className="rotate-slider-menu">
      <span className="title">Drag slider to change label rotation</span>

      <div className="bar-container">
        <input
          value={labelAngle + 90}
          type="range"
          min={ANTI_CLOCKWISE_MAX}
          max={CLOCKWISE_MAX}
          className="slider-bar"
          id="rotate-slider-bar"
          onChange={(e) => {
            let angle = Number(e.target.value);
            angle -= 90;
            setLabelAngle(angle);
            props.targetLabel.style("text-rotation", `${angle}deg`);
          }}
          onBlur={() => {
            if (props.targetLabel.data("textRotation") !== labelAngle) {
              updateActiveDiagramsAndPageFromCytoData(
                // update a clone to avoid render flicker and reverse the angle within 0-360 range
                props.targetLabel.clone().data({ textRotation: (360 - labelAngle) % 360 }),
              );
            }
          }}
        />
      </div>

      <span className="slider-value">{labelAngle + 90}°</span>
    </div>
  );
};
