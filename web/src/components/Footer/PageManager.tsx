import "./PageManager.scss";

import { PageDTO } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiIcon } from "@linzjs/lui";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import { useState } from "react";

import DeletePageModal from "@/components/Footer/DeletePageModal.tsx";
import { RenumberPageModal } from "@/components/Footer/RenumberPageModal.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  getActivePageNumber,
  getActivePages,
  getActiveSheet,
  getPages,
  removeDiagramPageRef,
  setActivePageNumber,
  updatePages,
} from "@/redux/planSheets/planSheetsSlice";

export interface IPopupModal {
  closeModal: () => void;
  pageInfo: { activeSheet: PlanSheetType; activePageNumber: number };
  callback: (newPageNumber: number) => void;
}

const PageManager = () => {
  const [renumberPageModal, setRenumberPageModal] = useState(false);
  const [deletePageModal, setDeletePageModal] = useState(false);
  const getAllPages = useAppSelector(getPages);
  const activePages = useAppSelector(getActivePages);
  const activePageNumber = useAppSelector(getActivePageNumber);
  const activeSheet = useAppSelector(getActiveSheet);
  const dispatch = useAppDispatch();

  const onPageRefRemoved = (pageId: number) => dispatch(removeDiagramPageRef(pageId));
  const onPageUpdated = (pages: PageDTO[]) => dispatch(updatePages(pages));

  const getMaxId = (pages: PageDTO[]) => {
    return pages.reduce((maxId, page) => (page.id > maxId ? page.id : maxId), 0);
  };
  const onActivePageNumberUpdated = (pageNumber: number) =>
    dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber }));

  const addNewLastPage = () => {
    const newPageNumber = activePages.length + 1;
    const newPageId = getMaxId(getAllPages) + 1;
    const newPage = {
      id: newPageId,
      pageType: activeSheet,
      pageNumber: newPageNumber,
    };
    onActivePageNumberUpdated(newPageNumber);
    onPageUpdated([...getAllPages, newPage]);
  };
  const addNewPageAfterCurrent = () => {
    const newPageNumber = activePageNumber + 1;
    const newPageId = getMaxId(getAllPages) + 1;
    const newPage = {
      id: newPageId,
      pageType: activeSheet,
      pageNumber: newPageNumber,
    };

    const updatedPages = getAllPages.map((page) => {
      if (page.pageType === activeSheet && page.pageNumber > activePageNumber) {
        return { ...page, pageNumber: page.pageNumber + 1 };
      }
      return page;
    });

    updatedPages.splice(
      updatedPages.findIndex((page) => page.pageNumber === activePageNumber + 1 && page.pageType === activeSheet),
      0,
      newPage,
    );
    onActivePageNumberUpdated(newPageNumber);
    onPageUpdated(updatedPages);
  };
  const addNewFirstPage = () => {
    const newPageId = getMaxId(getAllPages) + 1;
    const newPage = {
      id: newPageId,
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

    onActivePageNumberUpdated(1);
    onPageUpdated(updatedPages);
  };
  const renumberPages = (pageNumber: number) => {
    const updatedPages = getAllPages.map((page) => {
      if (page.pageType === activeSheet) {
        if (page.pageNumber === activePageNumber) {
          return { ...page, pageNumber: pageNumber };
        } else if (page.pageNumber > activePageNumber && page.pageNumber <= pageNumber) {
          return { ...page, pageNumber: page.pageNumber - 1 };
        } else if (page.pageNumber < activePageNumber && page.pageNumber >= pageNumber) {
          return { ...page, pageNumber: page.pageNumber + 1 };
        }
      }
      return page;
    });
    onActivePageNumberUpdated(pageNumber);
    onPageUpdated(updatedPages);
  };
  const deleteActivePage = (pageNumber: number): void => {
    let nextAvailPage: number | null = null;
    const tmpPages: PageDTO[] = [];

    const newPages = getAllPages.reduce((pages: PageDTO[], page) => {
      if (page.pageType === activeSheet) {
        if (page.pageNumber === pageNumber) {
          onPageRefRemoved(page.id);
          nextAvailPage = page.pageNumber;
          return pages;
        }
        if (page.pageNumber > pageNumber) {
          page = { ...page, pageNumber: page.pageNumber - 1 };
        }
        tmpPages.push(page);
      }
      pages.push(page);
      return pages;
    }, []);

    nextAvailPage =
      nextAvailPage === null
        ? tmpPages.length > 0
          ? 1
          : 0
        : nextAvailPage > tmpPages.length
          ? nextAvailPage - 1
          : nextAvailPage;

    onActivePageNumberUpdated(nextAvailPage);
    onPageUpdated(newPages);
  };

  const openRenumberModal = () => setRenumberPageModal(true);
  const openDeletePageModal = () => setDeletePageModal(true);
  const closeRenumberModal = () => setRenumberPageModal(false);
  const closeDeletePageModal = () => setDeletePageModal(false);
  const pageInfo = { activeSheet, activePageNumber };

  const cls = "change-sheet-button lui-button-tertiary lui-button-icon";

  return (
    <>
      <Menu
        menuButton={
          <LuiButton title="Add page" className={cls} disabled={activePageNumber === 0}>
            <LuiIcon alt="page icon" name="ic_add_page" size="md" />
            <LuiIcon alt="Dropdown icon" name="ic_arrow_drop_down" size="md" />
          </LuiButton>
        }
      >
        <MenuHeader className="change-sheet-header">Add page</MenuHeader>
        <MenuItem className="PlanSheetFooterMenuItem" onClick={addNewLastPage}>
          Add new last page
        </MenuItem>
        <MenuItem className="PlanSheetFooterMenuItem" onClick={addNewPageAfterCurrent}>
          Add new page after this one
        </MenuItem>
        <MenuItem className="PlanSheetFooterMenuItem" onClick={addNewFirstPage}>
          Add new first page
        </MenuItem>
      </Menu>

      <LuiButton title="Renumber page" className={cls} disabled={activePageNumber === 0} onClick={openRenumberModal}>
        <LuiIcon alt="page icon" name="ic_renumber_page" size="md" />
      </LuiButton>

      <LuiButton title="Delete page" className={cls} disabled={activePageNumber === 0} onClick={openDeletePageModal}>
        <LuiIcon alt="page icon" className="LuiIcon--error" name="ic_delete_page" size="md" />
      </LuiButton>

      {renumberPageModal && (
        <RenumberPageModal closeModal={closeRenumberModal} pageInfo={pageInfo} callback={renumberPages} />
      )}
      {deletePageModal && (
        <DeletePageModal closeModal={closeDeletePageModal} pageInfo={pageInfo} callback={deleteActivePage} />
      )}
    </>
  );
};

export default PageManager;
