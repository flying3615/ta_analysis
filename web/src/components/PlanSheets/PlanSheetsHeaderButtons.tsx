import { MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useState } from "react";

import { VerticalSpacer } from "@/components/Header/Header";
import { HeaderButton } from "@/components/Header/HeaderButton";
import { HeaderMenu } from "@/components/Header/HeaderMenu";

import { PlanSheetMenuLabels } from "./PlanSheetType";

const PlanSheetsHeaderButtons = () => {
  const [selectedButtonLabel, setSelectedButtonLabel] = useState("");

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
        headerMenuLabel={PlanSheetMenuLabels.PanMap}
        iconName="ic_pan_map_alt"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.PanMap);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomOut}
        iconName="ic_zoom_out"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.ZoomOut);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomIn}
        iconName="ic_add"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.ZoomIn);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomPrevious}
        iconName="ic_zoom_previous"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.ZoomPrevious);
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.ZoomCentre}
        iconName="ic_zoom_centre"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.ZoomCentre);
          alert("Not Yet Implemented");
        }}
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
          alert("Not Yet Implemented");
        }}
        selectedButtonLabel={selectedButtonLabel}
      />
      <HeaderButton
        headerMenuLabel={PlanSheetMenuLabels.SelectDiagram}
        iconName="ic_select_diagram"
        onClick={() => {
          handleHeaderButtonClick(PlanSheetMenuLabels.SelectDiagram);
          alert("Not Yet Implemented");
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
    </>
  );
};

export default PlanSheetsHeaderButtons;
