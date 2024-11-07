import { LuiButton, LuiIcon, LuiMiniSpinner } from "@linzjs/lui";

export interface MaintainDiagramsPanelFooterProps {
  isPending: boolean;
  isSuccess: boolean;
  hasChanged: boolean;
  cancel: () => Promise<void>;
  save: () => Promise<boolean>;
}

export const MaintainDiagramsPanelFooter = ({
  isPending,
  isSuccess,
  hasChanged,
  cancel,
  save,
}: MaintainDiagramsPanelFooterProps) => {
  return (
    <div className="MaintainDiagramsPanel__Footer">
      {isPending && (
        <div className="MaintainDiagramsPanel__Spinner">
          <LuiMiniSpinner size={24} />
          <div>Updating Layers</div>
        </div>
      )}
      {isSuccess && (
        <div className="MaintainDiagramsPanel__Saved">
          <LuiIcon name="ic_check_circle_outline" size="md" alt="Saved" />
          <div>All layers up to date</div>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <LuiButton level="secondary" onClick={() => void cancel()}>
        {hasChanged ? "Cancel" : "Close"}
      </LuiButton>
      <LuiButton level="primary" disabled={!hasChanged} onClick={() => void save()}>
        Save
      </LuiButton>
    </div>
  );
};
