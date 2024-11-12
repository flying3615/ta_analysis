import { LuiButton, LuiIcon, LuiTooltip } from "@linzjs/lui";
import { right } from "@popperjs/core";

import { DiagramDisplay } from "@/components/PlanSheets/DiagramList";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import {
  getActivePageNumber,
  getActivePageRefFromPageNumber,
  getActiveSheet,
  getPageNumberFromPageRef,
  setDiagramPageRef,
} from "@/redux/planSheets/planSheetsSlice";

interface IDiagramTileComponentProps {
  diagramDisplay: DiagramDisplay;
  selectedDiagramId: number | null;
  setSelectedDiagramId: (id: number | null) => void;
  setNewActivePageNumber: (pageNumber: number | null) => void;
}
const usePageData = () => {
  const activeSheet = useAppSelector(getActiveSheet);
  const activePageNumber = useAppSelector(getActivePageNumber);
  const activePageRef = useAppSelector(getActivePageRefFromPageNumber);
  return { activeSheet, activePageNumber, activePageRef };
};
const getSheetAddress = (activeSheet: PlanSheetType, pageNumber: number | null) => {
  const sheetFirstChar = activeSheet === PlanSheetType.TITLE ? "T" : "S";
  return `${sheetFirstChar}${pageNumber}`;
};
const usePageNumber = (pageRef: number | null | undefined) => {
  return useAppSelector((state) => (pageRef ? getPageNumberFromPageRef(state)(pageRef) : null));
};
const useRemoveFromPage = (diagramId: number, pageNumber: number | null) => {
  const dispatch = useAppDispatch();
  const activePageNumber = useAppSelector(getActivePageNumber);
  const { adjustDiagram } = useAdjustLoadedPlanData();

  return () => {
    if (pageNumber === activePageNumber) {
      dispatch(setDiagramPageRef({ id: diagramId, pageRef: undefined, adjustDiagram }));
    }
  };
};

export const DiagramTileComponent = ({
  diagramDisplay,
  selectedDiagramId,
  setSelectedDiagramId,
  setNewActivePageNumber,
}: IDiagramTileComponentProps) => {
  const { diagramId, level, pageRef, diagramLabel, diagramChildren } = diagramDisplay;
  const pageNumber = usePageNumber(pageRef);
  const { zoomToFit } = useCytoscapeContext();

  const { activeSheet, activePageNumber, activePageRef } = usePageData();
  const isSelected = selectedDiagramId === diagramId;
  const paddingMultiple = level <= 1 ? 0 : level - 1;

  const updatePageRef = () => {
    if (pageRef === undefined && activePageRef) {
      setSelectedDiagramId(selectedDiagramId === diagramId ? null : diagramId);
    }
  };
  const gotoPage = () => {
    if (pageNumber !== null) {
      setNewActivePageNumber(pageNumber);
      zoomToFit();
    }
  };
  const displaySheetAddress = getSheetAddress(activeSheet, pageNumber);
  const removeFromPage = useRemoveFromPage(diagramId, pageNumber);

  return (
    <div className="DiagramListLabel">
      <LuiTooltip mode="default-withDelay" message={diagramLabel} placement={right}>
        <div
          className={`DiagramLabel ${isSelected ? "selected" : ""} ${pageRef ? "muted" : ""}`}
          style={{ paddingLeft: 12 * paddingMultiple + 8 }}
          onClick={updatePageRef}
          role="presentation"
        >
          {level !== 0 && (
            <LuiIcon size="sm" name="ic_subdirectory_arrow_right" alt="subdirectory" className="DiagramListIcon" />
          )}

          <span className={`${pageRef ? "disabled" : ""}`}>{diagramLabel}</span>

          {pageRef && (
            <div className="DiagramLabel-right-nav">
              <LuiButton
                level="tertiary"
                className="lui-button-icon"
                disabled={pageNumber !== activePageNumber}
                onClick={removeFromPage}
              >
                <LuiIcon size="md" name="ic_remove_from_sheet" alt="Remove from sheet" />
              </LuiButton>
              <span className="LuiCounter-non-zero" onClick={gotoPage} role="presentation">
                {displaySheetAddress}
              </span>
            </div>
          )}
        </div>
      </LuiTooltip>
      {diagramChildren.map((d, index) => (
        <DiagramTileComponent
          key={index}
          diagramDisplay={d}
          selectedDiagramId={selectedDiagramId}
          setSelectedDiagramId={setSelectedDiagramId}
          setNewActivePageNumber={setNewActivePageNumber}
        />
      ))}
    </div>
  );
};
