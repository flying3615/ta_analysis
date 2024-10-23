import type { DiagramLayerPreferenceDTO } from "@linz/survey-plan-generation-api-client";
import { LuiBadge, LuiButton, LuiIcon } from "@linzjs/lui";
import { ColDefT, GridCell, GridEditBoolean } from "@linzjs/step-ag-grid";
import { useCallback, useMemo } from "react";

interface useMaintainDiagramsGridColDefsProps {
  refreshGrid: () => void;
  rows: (DiagramLayerPreferenceDTO & { id: number })[];
}

export const useMaintainDiagramsGridColDefs = ({ refreshGrid, rows }: useMaintainDiagramsGridColDefsProps) => {
  const toggleRow = useCallback(
    (row: DiagramLayerPreferenceDTO & { id: number }) => {
      row.selected = !row.selected;
      if (row.selected) {
        // Auto-select required layers on selecting dependant layer
        if (row.pldfIdRequired && !row.mandatory) {
          rows.forEach((r) => {
            if (r.id === row.pldfIdRequired) {
              r.selected = true;
            }
          });
        }
      } else {
        // Auto-deselect required layers on deselecting dependant layer
        rows.forEach((r) => {
          if (r.pldfIdRequired === row.id) {
            r.selected = false;
          }
        });
      }
    },
    [rows],
  );

  const columnDefs: ColDefT<DiagramLayerPreferenceDTO & { id: number }>[] = useMemo(() => {
    return [
      GridCell({
        colId: "selected",
        flex: 1,
        valueGetter: ({ data }) => (data.mandatory ? null : data.selected),
        cellRenderer: ({ data, value }) => (
          <div style={{ display: "flex" }}>
            <LuiButton
              className="lui-button-icon MaintainDiagramsGrid__ButtonSelected"
              level="text"
              size="sm"
              onClick={() => {
                toggleRow(data);
                refreshGrid();
              }}
              disabled={value === null}
            >
              {value === null ? (
                <LuiIcon name="ic_view" alt="mandatory selected" size="md" color="gray" />
              ) : value === true ? (
                <LuiIcon name="ic_view" alt="selected" size="md" />
              ) : (
                <LuiIcon name="ic_visiblity_off" alt="not selected" size="md" />
              )}
            </LuiButton>
            <div style={{ flex: 1 }}>{data.layerName}</div>
            {data.selected && data.hideFeature != null && (
              // eslint-disable-next-line
              <div
                className={`MaintainDiagramsGrid__BoundaryLines--${data.hideFeature ? "off" : "on"}`}
                onClick={() => {
                  if (data.hideFeature == null) return;
                  data.hideFeature = !data.hideFeature;
                  refreshGrid();
                }}
              >
                <LuiBadge ariaRoleDescription={`Boundary lines ${data.hideFeature ? "OFF" : "ON"}`}>
                  <LuiIcon name={data.hideFeature ? "ic_empty_circle" : "ic_check_circle"} alt="checked" size="sm" />
                  Boundary Lines {data.hideFeature ? "OFF" : "ON"}
                </LuiBadge>
              </div>
            )}
          </div>
        ),
        headerName: "Layers",
        resizable: false,
      }),
      GridEditBoolean(
        {
          field: "hideLabels",
          colId: "label",
          valueGetter: ({ data }) => !data.hideLabels,
          valueSetter: ({ data, newValue }) => (data.hideLabels = !newValue),
          headerName: "Labels",
          headerClass: "GridHeaderAlignCenter",
          cellClass: "GridCellAlignCenter",
          minWidth: 72,
          maxWidth: 72,
          editable: ({ data }) => data.selected,
        },
        {
          onClick: ({ selectedRows, checked }) => {
            selectedRows.forEach((row) => {
              row.hideLabels = !checked;
            });
            refreshGrid();
            return Promise.resolve(true);
          },
        },
      ),
    ];
  }, [refreshGrid, toggleRow]);

  return columnDefs;
};
