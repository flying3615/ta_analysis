import "./MaintainDiagramsPanel.scss";

import { LuiTabsContext, LuiTabsGroup, LuiTabsPanel, LuiTabsPanelSwitch } from "@linzjs/lui";
import { GridContextProvider, GridUpdatingContextProvider } from "@linzjs/step-ag-grid";
import { Panel, PanelContent, PanelHeader } from "@linzjs/windows";
import { isEmpty } from "lodash-es";
import { useRef, useState } from "react";

import { MaintainDiagramsByDiagramIdGrid } from "@/components/MaintainDiagramsPanel/MaintainDiagramsByDiagramIdGrid";
import { MaintainDiagramsByDiagramTypeGrid } from "@/components/MaintainDiagramsPanel/MaintainDiagramsByDiagramTypeGrid";
import { MaintainDiagramsGridRef } from "@/components/MaintainDiagramsPanel/MaintainDiagramsGridRef";

const maintainDiagramsByType = "maintainDiagramsByType";
const maintainDiagramsById = "maintainDiagramsById";

export interface MaintainDiagramsPanelProps {
  transactionId: number;
  selectedDiagramIds?: number[];
}

export const MaintainDiagramsPanel = ({ transactionId, selectedDiagramIds }: MaintainDiagramsPanelProps) => {
  const byTypeRef = useRef<MaintainDiagramsGridRef>(null);
  const byIdRef = useRef<MaintainDiagramsGridRef>(null);
  const [activePanel, _setActivePanel] = useState(
    isEmpty(selectedDiagramIds) ? maintainDiagramsByType : maintainDiagramsById,
  );

  /**
   * We want to be able to prevent selection of a new panel if there are unsaved changes.
   * Hence we proxy setActivePanel here.
   */
  const setActivePanel = (newPanel: string) => {
    void (async () => {
      if (
        (!byTypeRef.current || (await byTypeRef.current.checkSave())) &&
        (!byIdRef.current || (await byIdRef.current.checkSave()))
      ) {
        _setActivePanel(newPanel);
      }
    })();
  };

  return (
    <LuiTabsContext.Provider value={{ activePanel, setActivePanel }}>
      <Panel
        title="Maintain diagram layers by"
        position="center"
        size={{ width: 860, height: 650 }}
        maxHeight="90%"
        className="MaintainDiagramsPanel"
        modal={true}
      >
        <PanelHeader
          icon="ic_layers"
          onHelpClick={() => alert("Help!!!")}
          disablePopout={true}
          disableClose={true}
          extraLeft={
            <LuiTabsGroup ariaLabel="Tabs">
              <LuiTabsPanelSwitch targetPanel={maintainDiagramsByType}>Diagram type</LuiTabsPanelSwitch>
              <LuiTabsPanelSwitch targetPanel={maintainDiagramsById}>
                Individual user-defined diagram
              </LuiTabsPanelSwitch>
            </LuiTabsGroup>
          }
        />
        <PanelContent>
          <LuiTabsPanel key={maintainDiagramsByType} panel={maintainDiagramsByType}>
            <GridUpdatingContextProvider>
              <GridContextProvider>
                <MaintainDiagramsByDiagramTypeGrid key={activePanel} ref={byTypeRef} transactionId={transactionId} />
              </GridContextProvider>
            </GridUpdatingContextProvider>
          </LuiTabsPanel>
          <LuiTabsPanel key={maintainDiagramsById} panel={maintainDiagramsById} mode="lazy">
            <GridUpdatingContextProvider>
              <GridContextProvider>
                <MaintainDiagramsByDiagramIdGrid
                  key={activePanel}
                  ref={byIdRef}
                  transactionId={transactionId}
                  selectedDiagramIds={selectedDiagramIds}
                />
              </GridContextProvider>
            </GridUpdatingContextProvider>
          </LuiTabsPanel>
        </PanelContent>
      </Panel>
    </LuiTabsContext.Provider>
  );
};
