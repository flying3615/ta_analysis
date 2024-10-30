import "./MaintainDiagramsGrid.scss";

import type { DiagramLayerPreferenceDTO } from "@linz/survey-plan-generation-api-client";
import { LuiLoadingSpinner, LuiSelectInput } from "@linzjs/lui";
import { Grid, wait } from "@linzjs/step-ag-grid";
import { PanelInstanceContext, useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty, isEqual } from "lodash-es";
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useState } from "react";

import {
  allDiagramLayerPreferencesQueryKey,
  diagramNamesQueryKey,
  useDiagramLayerPreferencesByDiagramQuery,
  useDiagramNamesQuery,
} from "@/components/LabelPreferencesPanel/maintainDiagram";
import { useMaintainDiagramsGridColDefs } from "@/components/MaintainDiagramsPanel/MaintainDiagramsGridColDefs";
import { MaintainDiagramsGridRef } from "@/components/MaintainDiagramsPanel/MaintainDiagramsGridRef";
import { MaintainDiagramsPanelFooter } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanelFooter";
import { unsavedChangesModal } from "@/components/MaintainDiagramsPanel/UnsavedChangesModal";
import { withId } from "@/util/queryUtil";

export interface MaintainDiagramsByDiagramIdGridProps {
  transactionId: number;
  selectedDiagramIds?: number[];
}

export const MaintainDiagramsByDiagramIdGrid = forwardRef<
  MaintainDiagramsGridRef,
  MaintainDiagramsByDiagramIdGridProps
>(function MaintainDiagramsByDiagramIdGrid({ transactionId, selectedDiagramIds }, ref) {
  const { showPrefabModal } = useLuiModalPrefab();
  const { panelClose } = useContext(PanelInstanceContext);

  const queryClient = useQueryClient();

  const [saving, setSaving] = useState<boolean>();
  const [diagramId, setDiagramId] = useState<number>();
  const [diagramsById, setDiagramsById] = useState<(DiagramLayerPreferenceDTO & { id: number })[]>([]);

  const { data: diagramNames, isLoading: diagramNamesLoading } = useDiagramNamesQuery({ transactionId });

  /**
   * If the user selects diagrams on define diagrams the select must be filtered by those diagram selections.
   */
  const filteredDiagramNames = useMemo(() => {
    if (!diagramNames || diagramNamesLoading) return undefined;
    const diagrams = diagramNames?.diagrams;
    if (isEmpty(selectedDiagramIds)) return diagrams;
    return diagrams.filter((n) => selectedDiagramIds?.includes(n.id));
  }, [diagramNames, diagramNamesLoading, selectedDiagramIds]);

  /**
   * Auto-select first diagram in list if none selected
   */
  useEffect(() => {
    if (!filteredDiagramNames) return;
    const firstId = filteredDiagramNames?.[0]?.id;
    setDiagramId(firstId);
  }, [diagramNames, diagramNamesLoading, filteredDiagramNames]);

  /**
   * Load diagram preferences
   */
  const { data: diagramLayerPreferencesByDiagram, isLoading: diagramLoading } =
    useDiagramLayerPreferencesByDiagramQuery(
      {
        transactionId,
        diagramId: diagramId ?? 0,
      },
      // Only enabled once a diagram is selected
      { enabled: diagramId != null },
    );

  /**
   * Copy the initial preferences state for change detection and initialisation.
   */
  const diagramPreferencesInitialState = useMemo(
    () => withId(diagramLayerPreferencesByDiagram?.diagramLayerPreferences, "pldfId") ?? [],
    [diagramLayerPreferencesByDiagram],
  );

  const hasChanged = !isEqual(diagramsById, diagramPreferencesInitialState);

  const resetDiagrams = useCallback(() => {
    setDiagramsById(diagramPreferencesInitialState.map((d) => ({ ...d })));
  }, [diagramPreferencesInitialState]);

  /**
   * Initialise preferences on load
   */
  useEffect(resetDiagrams, [resetDiagrams]);

  const save = useCallback(async () => {
    setSaving(true);
    console.log("Save not implemented yet");
    await wait(1000);
    setSaving(false);
    return true;
  }, []);

  /**
   * If grid has changed ask if save required and save.
   * @return false cancel was pressed, true continue.
   */
  const checkSave = useCallback(async (): Promise<boolean> => {
    if (!hasChanged) return true;

    const result = await showPrefabModal(unsavedChangesModal);
    if (result === "discard") {
      resetDiagrams();
      return true;
    }
    if (result === "save") {
      return await save();
    }

    return false;
  }, [hasChanged, resetDiagrams, save, showPrefabModal]);

  useImperativeHandle(ref, () => ({
    checkSave,
  }));

  useEffect(() => {
    hasChanged && setSaving(undefined);
  }, [hasChanged]);

  const cancel = (): Promise<void> => {
    void queryClient.invalidateQueries({ queryKey: diagramNamesQueryKey(transactionId) });
    void queryClient.invalidateQueries({ queryKey: allDiagramLayerPreferencesQueryKey(transactionId) });
    return Promise.resolve().then(panelClose);
  };

  const refreshGrid = useCallback(() => {
    setDiagramsById([...diagramsById]);
  }, [diagramsById]);

  const columnDefs = useMaintainDiagramsGridColDefs({ refreshGrid, rows: diagramsById });

  if (diagramNamesLoading) {
    return <LuiLoadingSpinner />;
  }

  if (isEmpty(filteredDiagramNames)) {
    return (
      <>
        <div className="MaintainDiagramsGrid_NoDiagrams">No individual user defined diagrams found</div>
        <MaintainDiagramsPanelFooter hasChanged={hasChanged} saving={saving} save={save} cancel={cancel} />
      </>
    );
  }

  return (
    <>
      <div className="MaintainDiagramsGrid">
        <div className="MaintainDiagramsGrid__label">
          <div className="MaintainDiagramsGrid__labelLabel">Diagrams</div>
          <div className="MaintainDiagramsGrid__labelDescription">
            The layer states below will affect this diagram only
          </div>
        </div>
        <LuiSelectInput
          label=""
          options={
            filteredDiagramNames?.map((r) => ({
              value: r.id.toString(),
              label: r.name,
            })) ?? []
          }
          value={diagramId?.toString() ?? ""}
          onChange={(e) => {
            void (async () => {
              const newDiagramId = parseInt(e.target.value);
              if (!(await checkSave())) return;
              setDiagramId(newDiagramId);
            })();
          }}
        />
      </div>
      <Grid
        sizeColumns="none"
        loading={diagramLoading || isEmpty(diagramsById)}
        selectable={false}
        singleClickEdit={true}
        rowSelection="single"
        columnDefs={columnDefs}
        rowData={diagramsById ?? []}
      />
      <MaintainDiagramsPanelFooter hasChanged={hasChanged} saving={saving} save={save} cancel={cancel} />
    </>
  );
});
