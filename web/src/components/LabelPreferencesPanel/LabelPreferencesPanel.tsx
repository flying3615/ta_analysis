import "./LabelPreferencesPanel.scss";

import {
  LuiButton,
  LuiIcon,
  LuiLoadingSpinner,
  LuiTabsContext,
  LuiTabsGroup,
  LuiTabsPanel,
  LuiTabsPanelSwitch,
} from "@linzjs/lui";
import { GridContextProvider, GridUpdatingContextProvider } from "@linzjs/step-ag-grid";
import { Panel, PanelContent, PanelHeader, PanelInstanceContext } from "@linzjs/windows";
import { cloneDeep, isEqual, pick } from "lodash-es";
import { useContext, useEffect, useMemo, useState } from "react";

import {
  LabelPreferenceDTOWithId,
  useUpdateLabelPreferencesMutation,
  useUserLabelPreferences,
} from "@/components/LabelPreferencesPanel/labelPreferences";
import { LabelsManagementGrid } from "@/components/LabelPreferencesPanel/LabelsManagementGrid";

const labelsForThisPlan = "labelsForThisPlan";
const labelsForNewPlans = "labelsForNewPlans";

export interface LabelPreferencesPanelProps {
  transactionId: number;
}

interface Preferences {
  surveyLabelPreferences: LabelPreferenceDTOWithId[];
  userLabelPreferences: LabelPreferenceDTOWithId[];
}

export const LabelPreferencesPanel = ({ transactionId }: LabelPreferencesPanelProps) => {
  const { panelClose } = useContext(PanelInstanceContext);
  const [activePanel, setActivePanel] = useState(labelsForThisPlan);

  const { data: queryData, isLoading } = useUserLabelPreferences({ transactionId });
  const { mutateAsync, isPending, isSuccess, reset } = useUpdateLabelPreferencesMutation(transactionId);

  const [labelPreferences, setLabelPreferences] = useState<Preferences>({
    surveyLabelPreferences: [],
    userLabelPreferences: [],
  });
  const [initialLabelPreferences, setInitialLabelPreferences] = useState({
    ...labelPreferences,
  });

  useEffect(() => {
    if (!queryData) return;

    const preferences = pick(queryData, ["surveyLabelPreferences", "userLabelPreferences"]);
    setLabelPreferences(cloneDeep(preferences));
    setInitialLabelPreferences(cloneDeep(preferences));
  }, [queryData]);

  const save = () => mutateAsync(labelPreferences);

  const hasChanged = useMemo(
    () => !isEqual(labelPreferences, initialLabelPreferences),
    [initialLabelPreferences, labelPreferences],
  );

  useEffect(() => {
    if (hasChanged) {
      reset();
    }
  }, [hasChanged, reset]);

  return !queryData || isLoading ? (
    <LuiLoadingSpinner />
  ) : (
    <LuiTabsContext.Provider value={{ activePanel, setActivePanel }}>
      <Panel
        title="Label preferences"
        position="center"
        size={{ width: 860, height: 802 }}
        maxHeight="90%"
        className="LabelPreferencesPanel"
        modal={true}
      >
        {isPending && (
          <>
            <div className="MaintainDiagrams__overlay" />
            <LuiLoadingSpinner />
          </>
        )}
        <PanelHeader
          icon="ic_label_settings"
          onHelpClick={() => alert("Help!!!")}
          disablePopout={true}
          disableClose={true}
          extraLeft={
            <LuiTabsGroup ariaLabel="Tabs">
              <LuiTabsPanelSwitch targetPanel={labelsForThisPlan}>Labels for this plan</LuiTabsPanelSwitch>
              <LuiTabsPanelSwitch targetPanel={labelsForNewPlans}>Labels for new plans</LuiTabsPanelSwitch>
            </LuiTabsGroup>
          }
        />
        <PanelContent>
          <LuiTabsPanel key={labelsForThisPlan} panel={labelsForThisPlan}>
            <GridUpdatingContextProvider>
              <GridContextProvider>
                <LabelsManagementGrid
                  fonts={queryData.fonts}
                  defaults={queryData.defaults}
                  labelPreferences={labelPreferences.surveyLabelPreferences}
                  setLabelPreferences={(prefs: LabelPreferenceDTOWithId[]) => {
                    setLabelPreferences({ ...labelPreferences, surveyLabelPreferences: prefs });
                  }}
                />
              </GridContextProvider>
            </GridUpdatingContextProvider>
          </LuiTabsPanel>
          <LuiTabsPanel key={labelsForNewPlans} panel={labelsForNewPlans}>
            <GridUpdatingContextProvider>
              <GridContextProvider>
                <LabelsManagementGrid
                  fonts={queryData.fonts}
                  defaults={queryData.defaults}
                  labelPreferences={labelPreferences.userLabelPreferences}
                  setLabelPreferences={(prefs: LabelPreferenceDTOWithId[]) => {
                    setLabelPreferences({ ...labelPreferences, userLabelPreferences: prefs });
                  }}
                />
              </GridContextProvider>
            </GridUpdatingContextProvider>
          </LuiTabsPanel>
          <div className="LabelPreferencesPanel__Footer">
            {isSuccess && (
              <div className="LabelPreferencesPanel__Saved">
                <LuiIcon name="ic_check_circle_outline" size="md" alt="Saved" />
                <div>All preferences up to date</div>
              </div>
            )}
            <div style={{ flex: 1 }} />
            <LuiButton level="secondary" onClick={panelClose}>
              {hasChanged ? "Cancel" : "Close"}
            </LuiButton>
            <LuiButton level="primary" onClick={() => void save()} disabled={!hasChanged}>
              Save
            </LuiButton>
          </div>
        </PanelContent>
      </Panel>
    </LuiTabsContext.Provider>
  );
};
