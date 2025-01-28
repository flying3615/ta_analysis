import "./MoveDiagramToPageModal.scss";

import { PageDTO } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiTextInput } from "@linzjs/lui";
import {
  LuiModalAsync,
  LuiModalAsyncButtonGroup,
  LuiModalAsyncContent,
  LuiModalAsyncHeader,
  LuiModalAsyncMain,
} from "@linzjs/windows";
import clsx from "clsx";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import {
  getActivePageNumber,
  getActivePages,
  getActiveSheet,
  getFilteredPages,
  getPageRefFromPageNumber,
  getPages,
  setActivePageNumber,
  setDiagramPageRef,
  setElementsToMove,
  setLabelsPageRef,
  setLinesPageRef,
  updatePages,
} from "@/redux/planSheets/planSheetsSlice";
import { helpNodeIds, helpUrl } from "@/util/httpUtil";
import { newPageAfterCurrent, newPageAtTheEnd, newPageAtTheStart } from "@/util/pageUtil";

export interface ElementToMove {
  type: PlanElementType.LABELS | PlanElementType.LINES | PlanElementType.DIAGRAM;
  id: number | string;
}

export const MoveElementToPageModal = (props: { elementsToMove: ElementToMove[] }) => {
  const [selectedValue, setSelectedValue] = useState("existingPage");
  const dispatch = useAppDispatch();
  const { totalPages } = useAppSelector(getFilteredPages);
  const activePageNumber = useAppSelector(getActivePageNumber);
  const activeSheet = useAppSelector(getActiveSheet);
  const getAllPages = useAppSelector(getPages);
  const activePages = useAppSelector(getActivePages);
  const getPageRef = useAppSelector(getPageRefFromPageNumber);
  const onPageUpdated = (pages: PageDTO[]) => dispatch(updatePages(pages));
  const onActivePageNumberUpdated = (pageNumber: number) =>
    dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber }));
  const [pageError, setPageError] = useState<string | undefined>();
  const [pageWarning, setPageWarning] = useState<string | undefined>();
  const [newPageNumber, setNewPageNumber] = useState<number | undefined>(undefined);
  const { adjustDiagram } = useAdjustLoadedPlanData();

  // the esc callback should be the same as the cancel button,
  useEscapeKey({ callback: () => dispatch(setElementsToMove(undefined)) });

  const elementTypeName = props.elementsToMove[0]!.type;
  const elementTypeNameCapitalized = elementTypeName.charAt(0).toUpperCase() + elementTypeName.slice(1);
  const elementTypeNameIsOrAre = `${props.elementsToMove.length > 1 ? `${elementTypeNameCapitalized} are` : elementTypeName === PlanElementType.DIAGRAM ? `${elementTypeNameCapitalized} is` : `${elementTypeNameCapitalized.slice(0, -1)} is`}`;

  const pageInfo = { activeSheet, activePageNumber };
  const { zoomToFit } = useCytoscapeContext();
  const radioOptions = [
    { id: "existingPage", label: "An existing page" },
    { id: "newLastPage", label: "A new last page" },
    { id: "newPageAfterCurrent", label: "A new page after this one" },
    { id: "newFirstPage", label: "A new first page" },
  ];

  const onRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const existingPageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPageNumber(parseInt(e.target.value, 10));
  };

  const validatePageNumber = useCallback(
    (pageNumber: number | undefined): boolean => {
      const isValidPageNumber = (pageNumber: number | undefined) =>
        pageNumber !== undefined && !isNaN(Number(pageNumber)) && pageNumber > 0 && pageNumber <= totalPages;
      const isCurrentPage = (pageNumber: number | undefined) => pageNumber === pageInfo.activePageNumber;

      if (!isValidPageNumber(pageNumber)) {
        setPageError(`Enter a number between 1 and ${totalPages}`);
        setPageWarning(undefined);
        return false;
      }

      if (isCurrentPage(pageNumber)) {
        setPageError(undefined);
        setPageWarning(`${elementTypeNameIsOrAre} already on page ${pageInfo.activePageNumber}`);
        return false;
      }

      setPageError(undefined);
      setPageWarning(undefined);
      return true;
    },
    [elementTypeNameIsOrAre, pageInfo.activePageNumber, totalPages],
  );

  const moveElement = (pageRef: number) => {
    if (props.elementsToMove.length === 0) return;

    const firstElementToMove = props.elementsToMove[0]!;
    const firstElementId = firstElementToMove.id;
    const elementToMoveType = firstElementToMove.type;

    switch (elementToMoveType) {
      case PlanElementType.LABELS:
        const labelsIds = props.elementsToMove.map((element) => element.id.toString());
        dispatch(setLabelsPageRef({ ids: labelsIds, pageRef: pageRef }));
        break;
      case PlanElementType.LINES:
        const linesIds = props.elementsToMove.map((element) => element.id.toString());
        dispatch(setLinesPageRef({ ids: linesIds, pageRef: pageRef }));
        break;
      case PlanElementType.DIAGRAM:
        dispatch(setDiagramPageRef({ id: Number(firstElementId), pageRef: pageRef, adjustDiagram }));
        break;
    }
  };

  const moveToNewFirstPage = () => {
    const pages = newPageAtTheStart({ getAllPages, activeSheet });
    if (pages && pages.updatedPages) {
      onActivePageNumberUpdated(1);
      onPageUpdated(pages.updatedPages);
      zoomToFit();
      moveElement(pages.newPage.id);
      closeModal();
    }
  };

  const moveToNewLastPage = () => {
    const page = newPageAtTheEnd({ activePages, getAllPages, activeSheet });
    const newPageNumber = activePages.length + 1;
    if (page) {
      onActivePageNumberUpdated(newPageNumber);
      onPageUpdated([...getAllPages, page.newPage]);
      zoomToFit();
      moveElement(page.newPage.id);
      closeModal();
    }
  };

  const moveToNewPageAfterCurrent = () => {
    const newPages = newPageAfterCurrent({ activePageNumber, getAllPages, activeSheet });
    const newPageNumber = activePageNumber + 1;
    if (newPages && newPages.updatedPages) {
      onActivePageNumberUpdated(newPageNumber);
      onPageUpdated(newPages.updatedPages);
      zoomToFit();
      moveElement(newPages.newPage.id);
      closeModal();
    }
  };

  const moveToExistingPage = (pageNumber: number | undefined) => {
    if (!pageNumber) return;
    const pageRef = getPageRef(pageNumber);
    if (!pageRef) return;
    onActivePageNumberUpdated(pageNumber);
    zoomToFit();
    moveElement(pageRef);
    closeModal();
  };

  const onContinue = () => {
    if (selectedValue === "existingPage") {
      const isValid = validatePageNumber(newPageNumber);
      if (isValid) {
        moveToExistingPage(newPageNumber);
      }
    } else if (selectedValue === "newLastPage") {
      moveToNewLastPage();
    } else if (selectedValue === "newPageAfterCurrent") {
      moveToNewPageAfterCurrent();
    } else if (selectedValue === "newFirstPage") {
      moveToNewFirstPage();
    }
  };

  const closeModal = () => {
    dispatch(setElementsToMove(undefined));
  };

  useEffect(() => {
    if (newPageNumber === undefined) return;
    validatePageNumber(newPageNumber);
  }, [newPageNumber, validatePageNumber]);

  return (
    <LuiModalAsync closeOnOverlayClick={false}>
      <LuiModalAsyncMain>
        <LuiModalAsyncHeader
          title={`Move ${elementTypeName} to page`}
          helpLink={helpUrl(helpNodeIds.LAYOUT_PLAN_SHEETS)}
        />
        <LuiModalAsyncContent>
          <div className="MoveDiagramToPage">
            <fieldset>
              {radioOptions.map((option) => (
                <div key={option.id}>
                  <label
                    className={clsx("LuiRadioInput-label", {
                      "LuiRadioInput-label--isSelected": selectedValue === option.id,
                    })}
                  >
                    <input
                      type="radio"
                      name="moveToPage"
                      value={option.id}
                      className="LuiRadioInput-input"
                      checked={selectedValue === option.id}
                      onChange={onRadioChange}
                    />
                    <span>{option.label}</span>
                  </label>
                  {selectedValue === "existingPage" && option.id === "existingPage" && (
                    <div className="LuiTextWrap">
                      <LuiTextInput
                        size="sm"
                        inputProps={{
                          type: "number",
                          pattern: "\\d*",
                          placeholder: "Enter page number",
                        }}
                        label=""
                        error={pageError}
                        warning={pageWarning}
                        onChange={existingPageInputChange}
                      />
                    </div>
                  )}
                </div>
              ))}
            </fieldset>
          </div>
        </LuiModalAsyncContent>
      </LuiModalAsyncMain>
      <LuiModalAsyncButtonGroup>
        <LuiButton level="tertiary" onClick={closeModal}>
          Cancel
        </LuiButton>
        <LuiButton level="tertiary" onClick={onContinue}>
          Continue
        </LuiButton>
      </LuiModalAsyncButtonGroup>
    </LuiModalAsync>
  );
};
