import "./PageLabelInput.scss";

import { LuiIcon } from "@linzjs/lui";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { selectMaxPlanId } from "@/modules/plan/selectGraphData";
import { addPageLabel } from "@/modules/plan/updatePlanData";
import { getActivePage, replacePage, setPlanMode } from "@/redux/planSheets/planSheetsSlice.ts";
import { cytoscapeUtils } from "@/util/cytoscapeUtil.ts";

export const PageLabelInput = () => {
  const { cyto } = useCytoscapeContext();

  const activePage = useAppSelector(getActivePage);
  const maxPlanId = useAppSelector(selectMaxPlanId);

  const [inputPosition, setInputPosition] = useState<cytoscape.Position | null>(null);
  const [labelPosition, setLabelPosition] = useState<cytoscape.Position | null>(null);
  const [labelText, setLabelText] = useState("");
  const dispatch = useAppDispatch();

  const inputWidth = 250;
  const textLengthLimit = 2048;
  const specialCharsRegex = /[\u00B2\u00BA\u00B0]/; // ², º, °
  const textLengthErrorMessage = `${labelText.length - textLengthLimit} characters over the limit`;
  const invalidCharactersErrorMessage = "Invalid character(s) entered";

  const hasError = labelText.length > textLengthLimit || specialCharsRegex.test(labelText);

  const onClick = useCallback(
    (event: cytoscape.EventObject) => {
      const container = cyto?.container();
      if (hasError || !cyto || !container) {
        return;
      }
      const cytoCoordMapper = new CytoscapeCoordinateMapper(container, []);

      if (labelText && labelPosition && !hasError) {
        if (!activePage) {
          throw "no activePage";
        }
        // add page label to global state
        const position = cytoCoordMapper.pageLabelCytoscapeToCoord(labelPosition);
        dispatch(replacePage(addPageLabel(activePage, { id: maxPlanId + 1, displayText: labelText, position })));
        dispatch(setPlanMode(PlanMode.View));
        return;
      }

      const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
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
    [activePage, cyto, dispatch, hasError, labelText, labelPosition, maxPlanId],
  );

  useEffect(() => {
    cyto?.on("click", onClick);
    return () => {
      cyto?.off("click", onClick);
    };
  }, [cyto, onClick]);

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
