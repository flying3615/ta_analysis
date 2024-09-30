import { MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useState } from "react";

import { CommonButtons } from "@/components/CommonButtons.tsx";
import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { HeaderMenu } from "@/components/Header/HeaderMenu";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { getPlanMode, setPlanMode } from "@/redux/planSheets/planSheetsSlice.ts";
import { ZOOM_DELTA } from "@/util/cytoscapeUtil.ts";

import { PlanMode } from "./PlanSheetType";

export const PlanSheetsHeaderButtons = () => {
  const transactionId = useTransactionId();
  const [selectedButtonLabel, setSelectedButtonLabel] = useState("");
  const { zoomToFit, zoomByDelta, isMaxZoom, isMinZoom } = useCytoscapeContext();
  const dispatch = useAppDispatch();
  const planMode = useAppSelector(getPlanMode);

  const zoomIn = () => zoomByDelta(ZOOM_DELTA);
  const zoomOut = () => zoomByDelta(-ZOOM_DELTA);

  const handleHeaderButtonClick = (label: PlanMode) => {
    dispatch(setPlanMode(label));
  };

  return (
    <>
      <HeaderButton
        headerMenuLabel={PlanMode.LineArcReverse}
        iconName="ic_line_arc_reverse"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.LineArcReverse);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.Delete}
        iconName="ic_delete_forever"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.Delete);
          alert("Not Yet Implemented");
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
      <HeaderMenu
        primaryButtonLabel={PlanMode.ManageLabels}
        primaryButtonIcon="ic_manage_labels"
        selectedButtonLabel={selectedButtonLabel}
        setSelectedButtonLabel={setSelectedButtonLabel}
      >
        <MenuHeader>View labels</MenuHeader>
        {/* see https://www.figma.com/design/1BgaquDso4nMqlGAJ2bLdj/Plan-Generation-(Survey-Q)?node-id=0-1&t=w9XoSPwjxgkeJioP-0 */}
        <MenuItem>Dynamically gen list</MenuItem>
      </HeaderMenu>
      <HeaderButton
        headerMenuLabel={PlanMode.View}
        iconName="ic_view"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.View);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.Cursor}
        iconName="ic_pointer_outlined"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.Cursor);
          alert("Not Yet Implemented");
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
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectCoordinates}
        iconName="ic_select_coordinates"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectCoordinates);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectLine}
        iconName="ic_select_line"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectLine);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectPolygon}
        iconName="ic_polygon_selection"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectPolygon);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.AddLabel}
        iconName="ic_add_label"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.AddLabel);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.AddLine}
        iconName="ic_add_line"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.AddLine);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <HeaderButton
        headerMenuLabel={PlanMode.FormatLinesText}
        iconName="ic_format_lines_text"
        onClick={() => {
          handleHeaderButtonClick(PlanMode.FormatLinesText);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={planMode}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanMode.SelectRectangle}
        iconName="ic_square_selection"
        selectedButtonLabel={planMode}
        onClick={() => {
          handleHeaderButtonClick(PlanMode.SelectRectangle);
          alert("Not Yet Implemented");
        }}
      />

      <CommonButtons transactionId={transactionId} lockLabelsForThisPlan={true} />
    </>
  );
};
