import "./LabelRotationMenuItem.scss";

import { NodeSingular } from "cytoscape";
import { useCallback, useRef, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { lookupSource } from "@/redux/planSheets/planSheetsSlice.ts";

const ANTI_CLOCKWISE_MAX = -90;
const CLOCKWISE_MAX = 90;

export const LabelRotationMenuItem = (props: { targetLabel: NodeSingular }) => {
  const lookupSourceSelector = useAppSelector(lookupSource);

  const labelInRedux = useRef(
    lookupSourceSelector(props.targetLabel.data("elementType") as PlanElementType, props.targetLabel.data("id")),
  ).current;

  const degConverter = useCallback((input: string) => {
    let value = parseFloat(input);
    if (input.includes("rad")) {
      // Convert radians to degrees
      value = value * (180 / Math.PI);
      value = ((value + 180) % 360) - 180;
    }
    return Math.round(value);
  }, []);

  const [labelAngle, setLabelAngle] = useState<number>(degConverter(props.targetLabel.style("text-rotation")));

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
            if (labelInRedux) {
              // TODO: dispatch(updateLabel({ id: props.targetLabel.data("id"), rotationAngle: angle }));
              console.log(labelInRedux?.result);
            }
          }}
        />
      </div>

      <span className="slider-value">{labelAngle}°</span>
    </div>
  );
};
