import type {
  LabelPreferenceDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import { FontEnum } from "@linz/survey-plan-generation-api-client";
import { ColDefT, Grid, GridButton, GridCell, GridEditBoolean, GridPopoverEditDropDown } from "@linzjs/step-ag-grid";
import { ICellEditorParams } from "ag-grid-community";
import { fromPairs } from "lodash-es";
import { useCallback, useMemo } from "react";

import {
  LabelPreferenceDefaultDTOWithId,
  LabelPreferenceDTOWithId,
} from "@/components/LabelPreferencesPanel/labelPreferences";

const newFontDescriptions: Record<string, string> = {
  TAHM: "Roboto",
  TINR: "Tinos",
  ARIL: "Arimo",
};

export interface LabelsForThisPlanProps {
  fonts: LabelPreferencesResponseDTOFontsInner[];
  defaults: LabelPreferenceDefaultDTOWithId[];
  labelPreferences: LabelPreferenceDTOWithId[];
  setLabelPreferences: (prefs: LabelPreferenceDTOWithId[]) => void;
}

export const LabelsManagementGrid = ({
  fonts,
  defaults,
  labelPreferences,
  setLabelPreferences,
}: LabelsForThisPlanProps) => {
  const defaultMap = useMemo(() => fromPairs(defaults.map((d) => [d.labelType, d])), [defaults]);

  /**
   * Compare label preference with default
   *
   * @return true if no difference.
   */
  const notDefault = useCallback(
    (labelPreference: LabelPreferenceDTOWithId): boolean => {
      const m = defaultMap[labelPreference.labelType];
      return (
        !!m &&
        !(
          m.defaultBold === labelPreference.bold &&
          m.defaultFont === labelPreference.font &&
          m.defaultFontSize === labelPreference.fontSize
        )
      );
    },
    [defaultMap],
  );

  const updateLabelPreferences = useCallback(
    (selectedRowIds: string[], update: Partial<LabelPreferenceDTO>): void => {
      setLabelPreferences(
        labelPreferences.map((row) => (selectedRowIds.includes(row.id) ? { ...row, ...update } : row)),
      );
    },
    [labelPreferences, setLabelPreferences],
  );

  const columnDefs: ColDefT<LabelPreferenceDTOWithId>[] = useMemo((): ColDefT<LabelPreferenceDTOWithId>[] => {
    return [
      GridCell({
        colId: "description",
        headerName: "Label type",
        valueGetter: ({ data }) => defaultMap[data.id]?.description,
        flex: 1,
        resizable: false,
      }),
      GridButton(
        {
          colId: "revert",
          headerName: "Revert",
        },
        {
          visible: ({ data }: ICellEditorParams<LabelPreferenceDTOWithId>) => notDefault(data),
          onClick: ({ selectedRowIds }) => {
            const d = defaultMap[selectedRowIds[0]!];
            if (!d) return;

            updateLabelPreferences(selectedRowIds, {
              labelType: d.labelType,
              font: d.defaultFont,
              fontSize: d.defaultFontSize,
              bold: d.defaultBold,
            });
          },
        },
      ),
      GridPopoverEditDropDown<LabelPreferenceDTOWithId, keyof typeof FontEnum>(
        {
          minWidth: 190,
          field: "font",
          headerName: "Font",
          valueFormatter: ({ value }) => newFontDescriptions[value] ?? "",
          resizable: false,
        },
        {
          multiEdit: false,
          editorParams: {
            options: fonts.map((f) => ({
              value: f.code,
              label: (
                <>
                  <span className="LabelPreferencesPanel__font--description">{newFontDescriptions[f.code]}</span>
                  &nbsp;
                  <span className="LabelPreferencesPanel__font--was">(was {f.description})</span>
                </>
              ),
            })),
            onSelectedItem: ({ selectedRowIds, value }) => {
              updateLabelPreferences(selectedRowIds, { font: FontEnum[value] });
              return Promise.resolve();
            },
          },
        },
      ),
      GridPopoverEditDropDown<LabelPreferenceDTOWithId, number>(
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
            options: (selectedRows) => {
              const id = selectedRows[0]?.id;
              if (id == null) {
                return [];
              }
              const m = defaultMap[id];
              if (!m) {
                return [];
              }
              return m.fontSizeOptions.map((fontSize) => ({ value: fontSize, label: "" + fontSize }));
            },
            onSelectedItem: ({ selectedRowIds, value }) => {
              updateLabelPreferences(selectedRowIds, { fontSize: value });
              return Promise.resolve();
            },
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
          onClick: ({ selectedRowIds, checked }) => {
            updateLabelPreferences(selectedRowIds, { bold: checked });
            return Promise.resolve(true);
          },
        },
      ),
    ];
  }, [defaultMap, fonts, notDefault, updateLabelPreferences]);

  return (
    <Grid
      sizeColumns="none"
      selectable={false}
      singleClickEdit={true}
      rowSelection="single"
      columnDefs={columnDefs}
      rowData={labelPreferences}
    />
  );
};
