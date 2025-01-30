import "./LabelRotationMenuItem.scss";

import { NodeSingular } from "cytoscape";
import { debounce } from "lodash";
import { useMemo, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { getCorrectedLabelPosition } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppSelector } from "@/hooks/reduxHooks";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { convertToDegrees } from "@/util/stringUtil";

// Match with Legacy, 90 degrees is horizontal, left-most/counter-clockwise extent is 0, right-most/clockwise extent is 180
const ANTI_CLOCKWISE_MAX = 0;
const CLOCKWISE_MAX = 180;

export const LabelRotationMenuItem = (props: {
  targetLabel: NodeSingular;
  keepElementSelected: (callback: () => void) => void;
}) => {
  const { updateActiveDiagramsAndPageFromCytoData } = usePlanSheetsDispatch();
  const activeDiagrams = useAppSelector(selectActiveDiagrams);

  const cyto = props.targetLabel.cy();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(
    () => (container ? new CytoscapeCoordinateMapper(container, activeDiagrams) : null),
    [container, activeDiagrams],
  );

  const currentAngle = (props.targetLabel.style("text-rotation") as string) ?? "0";
  const [labelAngle, setLabelAngle] = useState<number>(Math.round(convertToDegrees(currentAngle)));

  const debouncedUpdate = useRef(
    debounce((angle: number) => {
      props.keepElementSelected(() => {
        if (props.targetLabel.data("textRotation") !== angle) {
          const positionCoord = getCorrectedLabelPosition(
            cyto,
            cytoCoordMapper,
            props.targetLabel.id(),
            "rotationSlide",
            { rotationAngle: angle, id: Number(props.targetLabel.id().replace("LAB_", "")) },
          );

          const modifiedLabel = props.targetLabel.clone();
          modifiedLabel.data({ textRotation: (360 - angle) % 360 });
          if (positionCoord) {
            modifiedLabel.position(positionCoord);
          }
          updateActiveDiagramsAndPageFromCytoData(modifiedLabel);
        }
      });
    }, 300),
  ).current;

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
            debouncedUpdate(angle);
          }}
        />
      </div>

      <span className="slider-value">{labelAngle + 90}°</span>
    </div>
  );
};
