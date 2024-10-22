import "./LabelRotationMenuItem.scss";

import { NodeSingular } from "cytoscape";
import { useCallback, useState } from "react";

import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";

const ANTI_CLOCKWISE_MAX = -90;
const CLOCKWISE_MAX = 90;

export const LabelRotationMenuItem = (props: { targetLabel: NodeSingular }) => {
  const { updateActiveDiagramsAndPageFromCytoData } = usePlanSheetsDispatch();

  const currentAngle = (props.targetLabel.style("text-rotation") as string) ?? "0";
  const degConverter = useCallback((input: string) => {
    let value = parseFloat(input);
    if (input.includes("rad")) {
      // Convert radians to degrees
      value = value * (180 / Math.PI);
      value = ((value + 180) % 360) - 180;
    }
    return Math.round(value);
  }, []);

  const [labelAngle, setLabelAngle] = useState<number>(degConverter(currentAngle));

  return (
    <div className="rotate-slider-menu">
      <span className="title">Drag slider to change label rotation</span>

      <div className="bar-container">
        <input
          value={labelAngle}
          type="range"
          min={ANTI_CLOCKWISE_MAX}
          max={CLOCKWISE_MAX}
          className="slider-bar"
          id="rotate-slider-bar"
          onChange={(e) => {
            const angle = Number(e.target.value);
            setLabelAngle(angle);
            props.targetLabel.style("text-rotation", `${angle}deg`);
          }}
          onBlur={() => {
            if (props.targetLabel.data("textRotation") !== labelAngle) {
              updateActiveDiagramsAndPageFromCytoData(
                // update a clone to avoid render flicker
                props.targetLabel.clone().data({ textRotation: labelAngle }),
              );
            }
          }}
        />
      </div>

      <span className="slider-value">{labelAngle}°</span>
    </div>
  );
};
