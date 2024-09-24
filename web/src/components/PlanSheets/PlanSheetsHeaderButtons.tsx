import { MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useState } from "react";

import { CommonButtons } from "@/components/CommonButtons.tsx";
import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { HeaderMenu } from "@/components/Header/HeaderMenu";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { ZOOM_DELTA } from "@/util/cytoscapeUtil.ts";

import { PlanSheetMenuLabels } from "./PlanSheetType";

export const PlanSheetsHeaderButtons = () => {
  const transactionId = useTransactionId();
  const [selectedButtonLabel, setSelectedButtonLabel] = useState("");
  const { zoomToFit, zoomByDelta, isMaxZoom, isMinZoom, applyGraphOptions } = useCytoscapeContext();
  const zoomIn = () => zoomByDelta(ZOOM_DELTA);
  const zoomOut = () => zoomByDelta(-ZOOM_DELTA);

  const handleHeaderButtonClick = (label: string) => {
    setSelectedButtonLabel(label);
  };

  return (
    <>
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.LineArcReverse}
        iconName="ic_line_arc_reverse"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.LineArcReverse);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.Delete}
        iconName="ic_delete_forever"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.Delete);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomIn}
        iconName="ic_add"
        disabled={isMaxZoom}
        onClick={zoomIn}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomOut}
        iconName="ic_zoom_out"
        disabled={isMinZoom}
        onClick={zoomOut}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomCentre}
        iconName="ic_zoom_centre"
        onClick={zoomToFit}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderMenu
        primaryButtonLabel={PlanSheetMenuLabels.ManageLabels}
        primaryButtonIcon="ic_manage_labels"
        selectedButtonLabel={selectedButtonLabel}
        setSelectedButtonLabel={setSelectedButtonLabel}
      >
        <MenuHeader>View labels</MenuHeader>
        {/* see https://www.figma.com/design/1BgaquDso4nMqlGAJ2bLdj/Plan-Generation-(Survey-Q)?node-id=0-1&t=w9XoSPwjxgkeJioP-0 */}
        <MenuItem>Dynamically gen list</MenuItem>
      </HeaderMenu>
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.View}
        iconName="ic_view"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.View);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.Cursor}
        iconName="ic_pointer_outlined"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.Cursor);
          applyGraphOptions({ nodeSelectable: false, edgeSelectable: false });
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectDiagram}
        iconName="ic_select_diagram"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectDiagram);
          applyGraphOptions({ nodeSelectable: true, edgeSelectable: true, elements: ":parent" });
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectLabel}
        iconName="ic_select_label"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectLabel);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectCoordinates}
        iconName="ic_select_coordinates"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectCoordinates);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectLine}
        iconName="ic_select_line"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectLine);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectPolygon}
        iconName="ic_polygon_selection"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectPolygon);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.AddLabel}
        iconName="ic_add_label"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.AddLabel);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.AddLine}
        iconName="ic_add_line"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.AddLine);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.FormatLinesText}
        iconName="ic_format_lines_text"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.FormatLinesText);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <VerticalSpacer />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectRectangle}
        iconName="ic_square_selection"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectRectangle);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />

      <CommonButtons transactionId={transactionId} lockLabelsForThisPlan={true} />
    </>
  );
};
