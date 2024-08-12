import { LuiButton, LuiIcon, LuiTooltip } from "@linzjs/lui";
import { right } from "@popperjs/core";
import { useEffect, useState } from "react";

import { DiagramDisplay } from "@/components/PlanSheets/DiagramList.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import {
  getActivePageRefFromPageNumber,
  getActiveSheet,
  getPageNumberFromPageRef,
  setActivePageNumber,
  setDiagramPageRef,
} from "@/redux/planSheets/planSheetsSlice.ts";

interface IDiagramTileComponentProps {
  diagramDisplay: DiagramDisplay;
  selectedDiagramId: number | null;
  setSelectedDiagramId: (id: number | null) => void;
}

export const DiagramTileComponent = ({
  diagramDisplay,
  selectedDiagramId,
  setSelectedDiagramId,
}: IDiagramTileComponentProps) => {
  const { diagramId, level, pageRef, diagramLabel, diagramChildren } = diagramDisplay;
  const dispatch = useAppDispatch();
  const activeSheet = useAppSelector(getActiveSheet);
  const activePageRef = useAppSelector(getActivePageRefFromPageNumber);
  const pageNumber = useAppSelector((state) => (pageRef ? getPageNumberFromPageRef(state)(pageRef) : null));
  const [currentPageRef, setCurrentPageRef] = useState<number | null>(null);
  const gotoPageNumber = useAppSelector((state) =>
    currentPageRef !== null ? getPageNumberFromPageRef(state)(currentPageRef) : null,
  );
  const isSelected = selectedDiagramId === diagramId;
  const paddingMultiple = level <= 1 ? 0 : level - 1;

  useEffect(() => {
    if (currentPageRef !== null && gotoPageNumber !== null) {
      dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber: gotoPageNumber }));
    }
  }, [activeSheet, currentPageRef, dispatch, gotoPageNumber]);
  const updatePageRef = () => {
    if (pageRef === undefined && activePageRef) {
      setSelectedDiagramId(selectedDiagramId === diagramId ? null : diagramId);
    }
  };
  const sheetAddress = () => {
    const sheetFirstChar = activeSheet === PlanSheetType.TITLE ? "T" : "S";
    return `${sheetFirstChar}${pageNumber}`;
  };
  const displaySheetAddress = sheetAddress();
  const gotoPage = () => {
    pageRef && setCurrentPageRef(pageRef);
  };
  const removeFromPage = () => {
    dispatch(setDiagramPageRef({ id: diagramId, pageRef: undefined }));
  };

  return (
    <div className="DiagramListLabel">
      <LuiTooltip mode="default-withDelay" message={diagramLabel} placement={right}>
        <div
          className={`DiagramLabel ${isSelected ? "selected" : ""}`}
          style={{ paddingLeft: 12 * paddingMultiple + 8 }}
          onClick={updatePageRef}
          role="presentation"
        >
          {level !== 0 && (
            <LuiIcon size="sm" name="ic_subdirectory_arrow_right" alt="subdirectory" className="DiagramListIcon" />
          )}

          <span className={`${pageRef !== undefined ? "disabled" : ""}`}>{diagramLabel}</span>

          {pageRef && (
            <div className="DiagramLabel-right-nav">
              <LuiButton level="tertiary" className="lui-button-icon" onClick={removeFromPage}>
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
        />
      ))}
    </div>
  );
};
