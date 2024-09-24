import type {
  LabelPreferenceDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import { LuiButton } from "@linzjs/lui";
import { ColDefT, Grid, GridButton, GridCell, GridEditBoolean, GridPopoverEditDropDown } from "@linzjs/step-ag-grid";
import { PanelInstanceContext } from "@linzjs/windows";
import { ICellEditorParams } from "ag-grid-community";
import { fromPairs } from "lodash-es";
import { useContext, useMemo, useState } from "react";

import { LabelPreferenceDTOWithId } from "@/components/LabelPreferencesPanel/labelPreferences.ts";

export interface LabelsForThisPlanProps {
  fonts: LabelPreferencesResponseDTOFontsInner[];
  defaults: LabelPreferenceDTO[];
  labelPreferences: LabelPreferenceDTOWithId[];
}

export const LabelsManagementGrid = ({ fonts, defaults, labelPreferences }: LabelsForThisPlanProps) => {
  const { panelClose } = useContext(PanelInstanceContext);
  const [list, setList] = useState(labelPreferences);

  const columnDefs: ColDefT<LabelPreferenceDTOWithId>[] = useMemo(() => {
    const fontMap = fromPairs(fonts.map((f) => [f.code, f.description]));

    return [
      GridCell({
        field: "description",
        headerName: "Label type",
        flex: 1,
        resizable: false,
      }),
      GridButton<LabelPreferenceDTOWithId>(
        {
          colId: "revert",
          headerName: "Revert",
        },
        {
          visible: ({ data }: ICellEditorParams) => {
            const m = defaults.find((r) => r.labelType === data.labelType);
            return !!(m && !(m.bold === data.bold && m.font === data.font && m.fontSize === data.fontSize));
          },
          onClick: ({ selectedRowIds }) => {
            setList(
              list.map((r) => {
                if (selectedRowIds.includes(r.labelType)) {
                  const d = defaults.find((d) => d.labelType === r.labelType);
                  if (!d) return r;
                  return { ...d, id: d.labelType };
                }
                return r;
              }),
            );
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          minWidth: 190,
          field: "font",
          headerName: "Font",
          valueFormatter: ({ value }) => {
            return fontMap[value] ?? "";
          },
          resizable: false,
        },
        {
          multiEdit: false,
          editorParams: {
            options: fonts.map((f) => ({ value: f.code, label: f.description })),
            /*            onSelectedItem: async () => {
              setList([...list]);
            },*/
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "fontSize",
          headerName: "Size",
          resizable: false,
          minWidth: 64,
          maxWidth: 64,
          headerClass: "GridHeaderAlignCenter",
          cellClass: "GridCellAlignCenter",
        },
        {
          multiEdit: false,
          editorParams: {
            className: "GridPopoverEditDropDown-containerAutoWidth",
            options: (selectedRows) =>
              (selectedRows[0]?.fontSizeOptions ?? []).map((r) => ({ value: r, label: "" + r })),
            /*            onSelectedItem: async () => {
              setList([...list]);
            },*/
          },
        },
      ),
      GridEditBoolean(
        {
          field: "bold",
          headerClass: "GridHeaderAlignCenter",
          cellClass: "GridCellAlignCenter",
        },
        {
          onClick: async ({ selectedRows, checked }) => {
            selectedRows.forEach((row) => (row.bold = checked));
            setList([...list]);
            return true;
          },
        },
      ),
    ];
  }, [defaults, fonts, list]);

  return (
    <>
      <Grid selectable={false} singleClickEdit={true} rowSelection="single" columnDefs={columnDefs} rowData={list} />
      <div style={{ display: "flex", marginLeft: "auto", padding: 16 }}>
        <LuiButton level="secondary" onClick={panelClose}>
          Cancel
        </LuiButton>
        <LuiButton level="primary">Save</LuiButton>
      </div>
    </>
  );
};
