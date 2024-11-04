import "./MaintainDiagramsGrid.scss";

import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import { DiagramLayerPreferenceDTO } from "@linz/survey-plan-generation-api-client";
import { LuiLoadingSpinner, LuiSelectInput } from "@linzjs/lui";
import { Grid } from "@linzjs/step-ag-grid";
import { PanelInstanceContext, useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty, isEqual } from "lodash-es";
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useState } from "react";

import {
  allDiagramLayerPreferencesQueryKey,
  useDiagramLayerPreferencesByDiagramTypeQuery,
  useDiagramTypesQuery,
  useUpdateLayerPreferencesByDiagramTypeMutation,
} from "@/components/LabelPreferencesPanel/maintainDiagram";
import { layerChangesWillOverwriteModal } from "@/components/MaintainDiagramsPanel/LayerChangesWillOverwriteModal";
import { useMaintainDiagramsGridColDefs } from "@/components/MaintainDiagramsPanel/MaintainDiagramsGridColDefs";
import { MaintainDiagramsGridRef } from "@/components/MaintainDiagramsPanel/MaintainDiagramsGridRef";
import { MaintainDiagramsPanelFooter } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanelFooter";
import { unsavedChangesModal } from "@/components/MaintainDiagramsPanel/UnsavedChangesModal";
import { withIdUndef } from "@/util/queryUtil";

export interface MaintainDiagramsByDiagramTypeGridProps {
  transactionId: number;
}

export const MaintainDiagramsByDiagramTypeGrid = forwardRef<
  MaintainDiagramsGridRef,
  MaintainDiagramsByDiagramTypeGridProps
>(function MaintainDiagramsByDiagramTypeGrid({ transactionId }, ref) {
  const { showPrefabModal } = useLuiModalPrefab();
  const queryClient = useQueryClient();

  const { data: diagramTypes, isLoading: diagramTypesLoading } = useDiagramTypesQuery({ transactionId });

  const userDefinedDiagramTypes = useMemo(() => {
    return diagramTypes?.diagramTypes;
  }, [diagramTypes]);

  const [saving, setSaving] = useState<boolean>();
  const [diagramTypeCode, setDiagramTypeCode] = useState<string>(CpgDiagramType.SYSP);
  const [diagramsByType, setDiagramsByType] = useState<(DiagramLayerPreferenceDTO & { id: number })[]>([]);
  const [diagramsByTypeInitialState, setDiagramsByTypeInitialState] = useState<
    (DiagramLayerPreferenceDTO & { id: number })[]
  >([]);
  const [hasChanged, setHasChanged] = useState(false);

  /**
   * Load diagram preferences
   */
  const { data: diagramLayerByType, isLoading: diagramByTypeLoading } = useDiagramLayerPreferencesByDiagramTypeQuery(
    {
      transactionId,
      diagramTypeCode,
    },
    // Only enabled once a diagram is selected
    { enabled: diagramTypeCode != null },
  );

  /**
   * Copy the initial preferences state for change detection and initialisation.
   */

  useEffect(() => {
    setDiagramsByTypeInitialState(withIdUndef(diagramLayerByType?.diagramLayerByTypePreferences, "pldfId") ?? []);
  }, [diagramLayerByType?.diagramLayerByTypePreferences]);

  useEffect(() => {
    setHasChanged(!isEqual(diagramsByType, diagramsByTypeInitialState));
  }, [diagramsByType, diagramsByTypeInitialState]);

  const resetDiagrams = useCallback(() => {
    setDiagramsByType(diagramsByTypeInitialState.map((r) => ({ ...r })));
  }, [diagramsByTypeInitialState]);

  /**
   * Initialise preferences on load
   */
  useEffect(resetDiagrams, [resetDiagrams]);

  const updateLayerPreferencesByDiagramTypeMutation = useUpdateLayerPreferencesByDiagramTypeMutation({
    transactionId,
    diagramTypeCode,
  });
  /**
   * Save the preference changes
   */
  const save = useCallback(async () => {
    const result = await showPrefabModal(layerChangesWillOverwriteModal);
    if (!result) {
      return false;
    }
    setSaving(true);
    await updateLayerPreferencesByDiagramTypeMutation.mutateAsync({ diagramsByType });
    setSaving(false);
    return true;
  }, [diagramsByType, updateLayerPreferencesByDiagramTypeMutation, showPrefabModal]);

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

  const { panelClose } = useContext(PanelInstanceContext);

  const cancel = async (): Promise<void> => {
    void queryClient.invalidateQueries({ queryKey: allDiagramLayerPreferencesQueryKey(transactionId) });
    return Promise.resolve().then(panelClose);
  };

  const refreshGrid = useCallback(() => {
    setDiagramsByType([...diagramsByType]);
  }, [diagramsByType]);

  const columnDefs = useMaintainDiagramsGridColDefs({ refreshGrid, rows: diagramsByType });

  return diagramTypesLoading ? (
    <LuiLoadingSpinner />
  ) : (
    <>
      <div className="MaintainDiagramsGrid">
        <div className="MaintainDiagramsGrid__label">
          <div className="MaintainDiagramsGrid__labelLabel">Diagram type</div>
          <div className="MaintainDiagramsGrid__labelDescription">
            The layer states below will affect diagrams of this type
          </div>
        </div>
        <LuiSelectInput
          label=""
          options={userDefinedDiagramTypes?.map((r) => ({ value: r.type, label: r.name })) ?? []}
          value={diagramTypeCode}
          onChange={(e) => {
            void (async () => {
              const newDiagramTypeCode = e.target.value;
              if (!(await checkSave())) return;
              setDiagramTypeCode(newDiagramTypeCode);
            })();
          }}
        />
      </div>
      <Grid
        sizeColumns="none"
        loading={diagramByTypeLoading || isEmpty(diagramsByType)}
        selectable={false}
        singleClickEdit={true}
        rowSelection="single"
        columnDefs={columnDefs}
        rowData={diagramsByType}
      />
      <MaintainDiagramsPanelFooter hasChanged={hasChanged} saving={saving} save={save} cancel={cancel} />
      {/* Overlay div that appears when saving is true */}
      {saving && <div className="MaintainDiagrams__overlay" />}
    </>
  );
});
