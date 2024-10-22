import "./PageLabelInput.scss";

import { LuiIcon } from "@linzjs/lui";
import clsx from "clsx";
import cytoscape, { NodeSingular } from "cytoscape";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { selectMaxPlanId } from "@/modules/plan/selectGraphData";
import { addPageLabel, updatePageLabel } from "@/modules/plan/updatePlanData";
import { getActivePage, getPlanMode, replacePage, setPlanMode } from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

export const PageLabelInput = () => {
  const { cyto } = useCytoscapeContext();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(() => (container ? new CytoscapeCoordinateMapper(container, []) : null), [container]);

  const activePage = useAppSelector(getActivePage);
  const maxPlanId = useAppSelector(selectMaxPlanId);
  const planMode = useAppSelector(getPlanMode);

  const [inputPosition, setInputPosition] = useState<cytoscape.Position | null>(null);
  const [labelPosition, setLabelPosition] = useState<cytoscape.Position | null>(null);
  const [labelText, setLabelText] = useState("");
  const labelRef = useRef<{ id: string; label: string } | null>(null);
  const dispatch = useAppDispatch();
  useEscapeKey({
    callback: () => {
      planMode === PlanMode.AddLabel && dispatch(setPlanMode(PlanMode.Cursor));
      planMode === PlanMode.SelectLabel && resetInput();
    },
  });

  const inputWidth = 250;
  const textLengthLimit = 2048;
  const specialCharsRegex = /[\u00B2\u00BA\u00B0]/; // ², º, °
  const textLengthErrorMessage = `${labelText.length - textLengthLimit} characters over the limit`;
  const invalidCharactersErrorMessage = "Invalid character(s) entered";

  const hasError = labelText.length > textLengthLimit || specialCharsRegex.test(labelText);

  const resetInput = () => {
    setLabelText("");
    setInputPosition(null);
    setLabelPosition(null);
  };

  const onClick = useCallback(
    (event: cytoscape.EventObjectCore | cytoscape.EventObjectNode) => {
      if (hasError || !activePage || !cyto || !cytoCoordMapper) return;

      if (planMode === PlanMode.SelectLabel) {
        // NOTE: this should possibly be a _separate handler_ from AddLabel
        // and use onSelect.  Also, edit not currently repositioning if out of bounds.

        if (event.originalEvent.ctrlKey) return; // prevent from showing input when ctrl is pressed
        if (event.target === event.cy) {
          return;
        }
        const target = event.target as NodeSingular;
        const { id, label, elementType } = target.data();
        if (elementType === PlanElementType.LABELS && target.selected()) {
          labelRef.current = { id, label };
          setInputPosition({ x: event.originalEvent.clientX, y: event.originalEvent.clientY });
          setLabelText((label as string) || "");
        }
      } else if (planMode === PlanMode.AddLabel) {
        const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
        if (!diagramAreasLimits?.diagramOuterLimitsPx) return;
        const diagramArea = diagramAreasLimits.diagramOuterLimitsPx;

        // set the input position to the clicked position
        let inputPosition: cytoscape.Position | null = {
          x: event.originalEvent.clientX,
          y: event.originalEvent.clientY,
        };
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
      }
    },
    [activePage, cyto, cytoCoordMapper, hasError, planMode],
  );

  const saveLabel = useCallback(() => {
    if (hasError || !activePage || !cytoCoordMapper) return;

    if (planMode === PlanMode.SelectLabel) {
      if (labelText && labelText !== labelRef.current?.label) {
        dispatch(
          replacePage(updatePageLabel(activePage, { id: Number(labelRef.current?.id), displayText: labelText })),
        );
        dispatch(setPlanMode(PlanMode.Cursor));
      }
    } else if (planMode === PlanMode.AddLabel) {
      if (labelText && labelPosition) {
        const position = cytoCoordMapper.pageLabelCytoscapeToCoord(labelPosition);
        dispatch(replacePage(addPageLabel(activePage, { id: maxPlanId + 1, displayText: labelText, position })));
        dispatch(setPlanMode(PlanMode.Cursor));
      }
    }
    resetInput();
  }, [activePage, cytoCoordMapper, dispatch, hasError, labelText, labelPosition, maxPlanId, planMode]);

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
          data-testid="PageLabelInput-textarea"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          placeholder="Enter some text"
          className={clsx("PageLabelInput", { error: hasError })}
          style={{
            width: inputWidth,
          }}
          onBlur={saveLabel}
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
