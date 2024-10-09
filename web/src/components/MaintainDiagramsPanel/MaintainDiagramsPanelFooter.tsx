import { LuiButton, LuiIcon, LuiMiniSpinner } from "@linzjs/lui";

export interface MaintainDiagramsPanelFooterProps {
  saving: boolean | undefined;
  hasChanged: boolean;
  cancel: () => Promise<void>;
  save: () => Promise<boolean>;
}

export const MaintainDiagramsPanelFooter = ({ saving, hasChanged, cancel, save }: MaintainDiagramsPanelFooterProps) => {
  return (
    <div className="MaintainDiagramsPanel__Footer">
      {saving && (
        <div className="MaintainDiagramsPanel__Spinner">
          <LuiMiniSpinner size={24} />
          <div>Updating Layers</div>
        </div>
      )}
      {saving === false && (
        <div className="MaintainDiagramsPanel__Saved">
          <LuiIcon name="ic_check_circle_outline" size="md" alt="Saved" />
          <div>All layers up to date</div>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <LuiButton level="secondary" onClick={() => void cancel()}>
        Cancel
      </LuiButton>
      <LuiButton level="primary" disabled={!hasChanged} onClick={() => void save()}>
        Save
      </LuiButton>
    </div>
  );
};
