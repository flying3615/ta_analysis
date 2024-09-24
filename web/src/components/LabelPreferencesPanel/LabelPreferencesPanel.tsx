import "./LabelPreferencesPanel.scss";

import { LuiLoadingSpinner, LuiTabs, LuiTabsGroup, LuiTabsPanel, LuiTabsPanelSwitch } from "@linzjs/lui";
import { GridContextProvider, GridUpdatingContextProvider } from "@linzjs/step-ag-grid";
import { Panel, PanelContent, PanelHeader } from "@linzjs/windows";

import { useUserLabelPreferences } from "@/components/LabelPreferencesPanel/labelPreferences.ts";
import { LabelsManagementGrid } from "@/components/LabelPreferencesPanel/LabelsManagementGrid.tsx";

const labelsForThisPlan = "labelsForThisPlan";
const labelsForNewPlans = "labelsForNewPlans";

export interface LabelPreferencesPanelProps {
  transactionId: number;
}

export const LabelPreferencesPanel = ({ transactionId }: LabelPreferencesPanelProps) => {
  const { data: queryData, isLoading } = useUserLabelPreferences({ transactionId });

  return !queryData || isLoading ? (
    <LuiLoadingSpinner />
  ) : (
    <LuiTabs defaultPanel={labelsForThisPlan}>
      <Panel
        title="Label preferences"
        position="center"
        size={{ width: 860, height: 802 }}
        className="LabelPreferencesPanel"
        modal={true}
      >
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
                  labelPreferences={queryData.userLabelPreferences}
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
                  labelPreferences={queryData.surveyLabelPreferences}
                />
              </GridContextProvider>
            </GridUpdatingContextProvider>
          </LuiTabsPanel>
        </PanelContent>
      </Panel>
    </LuiTabs>
  );
};
