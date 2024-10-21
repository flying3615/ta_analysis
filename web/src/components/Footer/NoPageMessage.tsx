import { PageDTO } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiIcon } from "@linzjs/lui";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import {
  getActivePages,
  getActiveSheet,
  getPages,
  setActivePageNumber,
  updatePages,
} from "@/redux/planSheets/planSheetsSlice";

export const NoPageMessage = () => {
  const getAllPages = useAppSelector(getPages);
  const activeSheet = useAppSelector(getActiveSheet);
  const activePages = useAppSelector(getActivePages);
  const dispatch = useAppDispatch();
  const onPageUpdated = (pages: PageDTO[]) => dispatch(updatePages(pages));
  const onPageNumberUpdated = (activePageNumber: { pageType: PlanSheetType; pageNumber: number }) =>
    dispatch(setActivePageNumber(activePageNumber));

  const getMaxId = (pages: PageDTO[]) => {
    return pages.reduce((maxId, page) => (page.id > maxId ? page.id : maxId), 0);
  };

  const addNewPage = () => (!activePages.length ? addFirstPage() : null);

  const addFirstPage = () => {
    const newPage = {
      id: getMaxId(getAllPages) + 1,
      pageType: activeSheet,
      pageNumber: 1,
    };

    const updatedPages = getAllPages.map((page) => {
      if (page.pageType === activeSheet) {
        return { ...page, pageNumber: page.pageNumber + 1 };
      }
      return page;
    });
    updatedPages.unshift(newPage);
    onPageUpdated(updatedPages);
    onPageNumberUpdated({ pageType: activeSheet, pageNumber: 1 });
  };

  // Add a new page if no active pages when the <Enter> is pressed
  useOnKeyDown("Enter", addNewPage);

  return (
    <div className="Cytoscape_no-pages">
      <p>It looks like your plan does not have any pages</p>
      <LuiButton level="primary" className="lui-button-icon" onClick={addNewPage}>
        <LuiIcon size="md" name="ic_add_page" alt="Add new page" />
        Add new page
      </LuiButton>
      <span className="lui-show-block">
        or hit <b>Return</b> to add new page
      </span>
    </div>
  );
};
