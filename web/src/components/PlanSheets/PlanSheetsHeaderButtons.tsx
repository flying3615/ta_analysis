import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiIcon } from "@linzjs/lui";
import { PanelsContext } from "@linzjs/windows";
import { EdgeSingular, EventObject, NodeSingular } from "cytoscape";
import React, { useContext, useEffect, useState } from "react";

import { CommonButtons } from "@/components/CommonButtons";
import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { SELECTED_PAGE_LABELS, SELECTED_PAGE_LINES } from "@/components/PlanSheets/interactions/DeleteKeyHandler";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";
import {
  canUndo,
  getCanViewHiddenLabels,
  getPlanMode,
  setCanViewHiddenLabels,
  setPlanMode,
  undo,
} from "@/redux/planSheets/planSheetsSlice";
import { ZOOM_DELTA } from "@/util/cytoscapeUtil";

import { PlanMode } from "./PlanSheetType";
import { ViewLabelTypes } from "./ViewLabelTypes";

export const PlanSheetsHeaderButtons = () => {
  const [selectedButtonLabel, setSelectedButtonLabel] = useState<PlanMode>();

  const { openPanel } = useContext(PanelsContext);
  const { zoomToFit, zoomByDelta, isMaxZoom, isMinZoom, cyto } = useCytoscapeContext();
  const dispatch = useAppDispatch();
  const planMode = useAppSelector(getPlanMode);
  const enableUndo = useAppSelector(canUndo);
  const canViewHiddenLabels = useAppSelector(getCanViewHiddenLabels);
  const [canDelete, setCanDelete] = useState(false);
  const { deletePageLines } = usePageLineEdit();
  const { deletePageLabels } = usePageLabelEdit();

  const zoomIn = () => zoomByDelta(ZOOM_DELTA);
  const zoomOut = () => zoomByDelta(-ZOOM_DELTA);

  const handleHeaderButtonClick = (label: PlanMode) => {
    setSelectedButtonLabel(label);
    dispatch(setPlanMode(label));
  };

  const checkCanDelete = (event: EventObject): boolean => {
    const selectedElements = event.cy.elements(":selected");
    if (selectedElements.length === 0) return false;
    return selectedElements.every(
      (ele) =>
        ele.data("coordType") === "userDefined" ||
        ele.data("lineType") === "userDefined" ||
        ele.data("labelType") === LabelDTOLabelTypeEnum.userAnnotation,
    );
  };

  useEffect(() => {
    const setCanDeleteHandler = (event: EventObject) => setCanDelete(checkCanDelete(event));
    if (selectedButtonLabel && [PlanMode.SelectLine, PlanMode.SelectLabel].includes(selectedButtonLabel)) {
      cyto?.on("render", setCanDeleteHandler);
    }
    return () => {
      cyto?.off("render", setCanDeleteHandler);
    };
  }, [cyto, selectedButtonLabel]);

  return (
    <>
      <HeaderButton
        headerMenuLabel={PlanMode.Undo}
        iconName="ic_line_arc_reverse"
        disabled={!enableUndo}
        onClick={() => {
          dispatch(undo());
        }}
      />
      <HeaderButton
        disabled={!canDelete}
        headerMenuLabel={PlanMode.Delete}
        iconName="ic_delete_forever"
        onClick={() => {
          if (selectedButtonLabel === PlanMode.SelectLine) {
            const selectedElements = cyto?.$(SELECTED_PAGE_LINES);
            if (!selectedElements || selectedElements.length === 0) return;
            deletePageLines([...selectedElements] as EdgeSingular[]);
          }

          if (selectedButtonLabel === PlanMode.SelectLabel) {
            const selectedElements = cyto?.$(SELECTED_PAGE_LABELS);
            if (!selectedElements || selectedElements.length === 0) return;
            deletePageLabels([...selectedElements] as NodeSingular[]);
          }
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.ZoomIn}
        iconName="ic_add"
        disabled={isMaxZoom}
        onClick={zoomIn}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.ZoomOut}
        iconName="ic_zoom_out"
        disabled={isMinZoom}
        onClick={zoomOut}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.ZoomCentre}
        iconName="ic_zoom_centre"
        onClick={zoomToFit}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.ViewLabels}
        iconName="ic_manage_labels"
        onClick={() => openPanel("View labels", () => <ViewLabelTypes />)}
        selectedButtonLabel={selectedButtonLabel}
      />

      <LuiButton
        onClick={() => {
          dispatch(setCanViewHiddenLabels(!canViewHiddenLabels));
        }}
        className="lui-button-icon lui-button-icon-only lui-button-tertiary"
      >
        {canViewHiddenLabels ? (
          <LuiIcon name="ic_view" alt={PlanMode.View} size="md" title={PlanMode.View} />
        ) : (
          <LuiIcon name="ic_visiblity_off" alt={PlanMode.View} size="md" title={PlanMode.View} />
        )}
      </LuiButton>

      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.Cursor}
        iconName="ic_pointer_outlined"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.Cursor);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectDiagram}
        iconName="ic_select_diagram"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectDiagram);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectLabel}
        iconName="ic_select_label"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectLabel);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectCoordinates}
        iconName="ic_select_coordinates"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectCoordinates);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectLine}
        iconName="ic_select_line"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectLine);
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        disabled={true}
        headerMenuLabel={PlanMode.NotImplemented}
        iconName="ic_polygon_selection"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.NotImplemented);
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.AddLabel}
        iconName="ic_add_label"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.AddLabel);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.AddLine}
        iconName="ic_add_line"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.AddLine);
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        disabled={true}
        headerMenuLabel={PlanMode.NotImplemented}
        iconName="ic_format_lines_text"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.NotImplemented);
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.NotImplemented}
        disabled={true}
        iconName="ic_square_selection"
        selectedButtonLabel={planMode}
        onClick={() => {
          handleHeaderButtonClick(PlanMode.NotImplemented);
        }}
      />
      <div className="CommonButtons__fill" />
      <CommonButtons />
    </>
  );
};
