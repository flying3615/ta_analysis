import type {
  LabelPreferenceDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import { LuiButton } from "@linzjs/lui";
import { ColDefT, Grid, GridButton, GridCell, GridEditBoolean, GridPopoverEditDropDown } from "@linzjs/step-ag-grid";
import { PanelInstanceContext } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { ICellEditorParams } from "ag-grid-community";
import { fromPairs } from "lodash-es";
import { useContext, useMemo, useState } from "react";

import {
  LabelPreferenceDTOWithId,
  userLabelPreferencesQueryKey,
} from "@/components/LabelPreferencesPanel/labelPreferences";

export interface LabelsForThisPlanProps {
  transactionId: number;
  fonts: LabelPreferencesResponseDTOFontsInner[];
  defaults: LabelPreferenceDTO[];
  labelPreferences: LabelPreferenceDTOWithId[];
  readOnly?: boolean;
}

export const LabelsManagementGrid = ({
  transactionId,
  fonts,
  defaults,
  labelPreferences,
  readOnly = false,
}: LabelsForThisPlanProps) => {
  const queryClient = useQueryClient();
  const { panelClose } = useContext(PanelInstanceContext);
  const [list, setList] = useState(labelPreferences);

  const close = () => {
    void queryClient.invalidateQueries({ queryKey: userLabelPreferencesQueryKey(transactionId) });
    panelClose();
  };

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
            if (readOnly) return false;
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
          editable: !readOnly,
        },
        {
          multiEdit: false,
          editorParams: {
            options: fonts.map((f) => ({ value: f.code, label: f.description })),
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
          editable: !readOnly,
        },
        {
          multiEdit: false,
          editorParams: {
            className: "GridPopoverEditDropDown-containerAutoWidth",
            options: (selectedRows) =>
              (selectedRows[0]?.fontSizeOptions ?? []).map((r) => ({ value: r, label: "" + r })),
          },
        },
      ),
      GridEditBoolean(
        {
          field: "bold",
          headerClass: "GridHeaderAlignCenter",
          cellClass: "GridCellAlignCenter",
          editable: !readOnly,
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
  }, [defaults, fonts, list, readOnly]);

  return (
    <>
      <Grid
        selectable={false}
        singleClickEdit={true}
        rowSelection="single"
        columnDefs={columnDefs}
        rowData={list}
        readOnly={readOnly}
      />
      <div className="LabelPreferencesPanel__Footer">
        <LuiButton level="secondary" onClick={close}>
          Cancel
        </LuiButton>
        <LuiButton level="primary">Save</LuiButton>
      </div>
    </>
  );
};
