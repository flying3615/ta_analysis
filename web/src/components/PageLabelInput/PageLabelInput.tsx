import "./PageLabelInput.scss";

import { LuiIcon } from "@linzjs/lui";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useEscapeKey } from "@/hooks/useEscape";
import { addPageLabel, getPlanMode, setPlanMode } from "@/redux/planSheets/planSheetsSlice.ts";
import { cytoscapeUtils } from "@/util/cytoscapeUtil.ts";

interface InputLabelProps {
  cy: cytoscape.Core | undefined;
  cytoCoordMapper: CytoscapeCoordinateMapper | undefined;
}

export const PageLabelInput = ({ cy, cytoCoordMapper }: InputLabelProps) => {
  const [inputPosition, setInputPosition] = useState<cytoscape.Position | null>(null);
  const [labelPosition, setLabelPosition] = useState<cytoscape.Position | null>(null);
  const [labelText, setLabelText] = useState("");
  const planMode = useAppSelector(getPlanMode);
  const dispatch = useAppDispatch();
  useEscapeKey({ callback: () => resetInput() });

  const inputWidth = 250;
  const textLengthLimit = 2048;
  const specialCharsRegex = /[\u00B2\u00BA\u00B0]/; // ², º, °
  const textLengthErrorMessage = `${labelText.length - textLengthLimit} characters over the limit`;
  const invalidCharactersErrorMessage = "Invalid character(s) entered";

  const resetInput = () => {
    setLabelText("");
    setInputPosition(null);
    setLabelPosition(null);
  };

  const hasError = labelText.length > textLengthLimit || specialCharsRegex.test(labelText);

  const onClick = useCallback(
    (event: cytoscape.EventObject) => {
      if (hasError || !cy || !cytoCoordMapper) {
        return;
      }
      if (labelText && labelPosition && !hasError) {
        // add page label to global state
        const position = cytoCoordMapper.pageLabelCytoscapeToCoord(labelPosition);
        dispatch(addPageLabel({ labelText, position }));

        resetInput();
        dispatch(setPlanMode(PlanMode.View));
        return;
      }
      const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cy);

      if (!diagramAreasLimits?.diagramOuterLimitsPx) return;
      const diagramArea = diagramAreasLimits.diagramOuterLimitsPx;

      // set the input position to the clicked position
      let inputPosition: cytoscape.Position | null = { x: event.originalEvent.clientX, y: event.originalEvent.clientY };
      setLabelPosition(event.position);

      // If the clicked position.x plus the input width is bigger than diagram area xMax, flip the input
      if (event.position.x + inputWidth > diagramArea?.x2) {
        inputPosition = { x: event.originalEvent.clientX - inputWidth, y: event.originalEvent.clientY };
      }
      // If the clicked position is out of the diagram area, remove it
      if (!cytoscapeUtils.isPositionWithinAreaLimits(event.position, [diagramArea])) {
        inputPosition = null;
      }
      // If the clicked position is in a disabled area (eg. text block, pageNo), remove it
      if (cytoscapeUtils.isPositionWithinAreaLimits(event.position, diagramAreasLimits.disabledAreasLimitsPx)) {
        inputPosition = null;
      }
      setInputPosition(inputPosition);
    },
    [cy, cytoCoordMapper, labelText, labelPosition, dispatch, hasError],
  );

  useEffect(() => {
    planMode != PlanMode.AddLabel ? resetInput() : cy?.on("click", onClick);
    return () => {
      cy?.removeListener("click", onClick);
    };
  }, [cy, cytoCoordMapper, planMode, onClick]);

  return (
    inputPosition && (
      <div
        className="PageLabelInput-container"
        style={{
          top: inputPosition.y,
          left: inputPosition.x,
        }}
      >
        <textarea
          /* eslint-disable jsx-a11y/no-autofocus */
          autoFocus
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          placeholder="Enter some text"
          className={clsx("PageLabelInput", { error: hasError })}
          style={{
            width: inputWidth,
          }}
        />
        {hasError && (
          <div className="PageLabelInput-error">
            <LuiIcon alt="error" name="ic_error" className="PageLabelInput-error-icon" size="sm" status="error" />
            <span>
              {specialCharsRegex.test(labelText)
                ? invalidCharactersErrorMessage
                : labelText.length > textLengthLimit
                  ? textLengthErrorMessage
                  : ""}
            </span>
          </div>
        )}
      </div>
    )
  );
};
