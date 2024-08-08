import { IPage } from "@linz/survey-plan-generation-api-client";
import { LuiAlertModalV2, LuiButton, LuiIcon, LuiModalV2, LuiTextInput } from "@linzjs/lui";
import { Menu, MenuHeader, MenuItem } from "@szhsin/react-menu";
import { ChangeEvent, useState } from "react";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  getActivePageNumber,
  getActivePages,
  getActiveSheet,
  getFilteredPages,
  getPages,
  setActivePageNumber,
  updatePages,
} from "@/redux/planSheets/planSheetsSlice";

interface IPopupModal {
  closeModal: () => void;
  pageInfo: { activeSheet: PlanSheetType; activePageNumber: number };
  callback: (newPageNumber: number) => void;
}

const PageManager = () => {
  const cls = "change-sheet-button lui-button-tertiary lui-button-icon";
  const [renumberModal, setRenumberModal] = useState(false);
  const [deletePageModal, setDeletePageModal] = useState(false);
  const getAllPages = useAppSelector(getPages);
  const activePages = useAppSelector(getActivePages);
  const activePageNumber = useAppSelector(getActivePageNumber);
  const activeSheet = useAppSelector(getActiveSheet);
  const dispatch = useAppDispatch();

  const getMaxId = (pages: IPage[]) => {
    return pages.reduce((maxId, page) => (page.id > maxId ? page.id : maxId), 0);
  };

  const onPageUpdated = (pages: IPage[]) => dispatch(updatePages(pages));
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

    onPageUpdated(updatedPages);
  };
  const renumberPages = (pageNumber: number) => {
    const updatedPages = getAllPages.map((page) => {
      if (page.pageType === activeSheet) {
        if (page.pageNumber === activePageNumber) {
          return { ...page, pageNumber: pageNumber };
        } else if (page.pageNumber === pageNumber) {
          return { ...page, pageNumber: activePageNumber };
        }
      }
      return page;
    });
    onPageUpdated(updatedPages);
  };
  const deleteActivePage = (pageNumber: number) => {
    const updatedPages = getAllPages.filter(
      (page) => !(page.pageType === activeSheet && page.pageNumber === pageNumber),
    );
    let newActivePageNumber = 0;
    if (updatedPages.length > 0) {
      const nextPage = updatedPages.find((page) => page.pageType === activeSheet && page.pageNumber > activePageNumber);
      if (nextPage) {
        newActivePageNumber = nextPage.pageNumber;
      } else {
        const previousPage = updatedPages.find(
          (page) => page.pageType === activeSheet && page.pageNumber < activePageNumber,
        );
        newActivePageNumber = previousPage ? previousPage.pageNumber : 0;
      }
    }
    onActivePageNumberUpdated(newActivePageNumber);

    onPageUpdated(updatedPages);
  };
  const openRenumberModal = () => setRenumberModal(true);
  const openDeletePageModal = () => setDeletePageModal(true);
  const closeRenumberModal = () => setRenumberModal(false);
  const closeDeletePageModal = () => setDeletePageModal(false);
  const pageInfo = { activeSheet, activePageNumber };

  return (
    <>
      <Menu
        menuButton={
          <LuiButton title="Add page" className={cls}>
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

      <LuiButton title="Renumber page" className={cls} onClick={openRenumberModal}>
        <LuiIcon alt="page icon" name="ic_renumber_page" size="md" />
      </LuiButton>

      <LuiButton title="Delete page" className={cls} onClick={openDeletePageModal}>
        <LuiIcon alt="page icon" className="LuiIcon--error" name="ic_delete_page" size="md" />
      </LuiButton>

      {renumberModal && <RenumberModal closeModal={closeRenumberModal} pageInfo={pageInfo} callback={renumberPages} />}
      {deletePageModal && (
        <DeleteModal closeModal={closeDeletePageModal} pageInfo={pageInfo} callback={deleteActivePage} />
      )}
    </>
  );
};

const RenumberModal = ({ closeModal, pageInfo, callback }: IPopupModal) => {
  const { totalPages } = useAppSelector(getFilteredPages);
  const [renumberError, setRenumberError] = useState("");
  const [newPageNumber, setNewPageNumber] = useState("");

  const renumberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPageNumber(e.target.value);
  };

  const renumberPage = () => {
    const pageNumber = parseInt(newPageNumber, 10);
    if (isNaN(pageNumber) || pageNumber <= 0 || pageNumber > totalPages) {
      setRenumberError(`Please enter a valid page number between 1 and ${totalPages}.`);
    } else {
      setRenumberError("");
      closeModal();
      callback(pageNumber);
    }
  };

  return (
    <LuiModalV2 headingText="Renumber page" shouldCloseOnOverlayClick preventAutoFocus onClose={closeModal}>
      <LuiTextInput
        label={`Renumber ${pageInfo.activeSheet.toUpperCase()} Page ${pageInfo.activePageNumber} to:`}
        size="sm"
        onChange={renumberInputChange}
        error={renumberError}
      />
      <LuiModalV2.Buttons>
        <LuiButton level="secondary" onClick={closeModal}>
          Cancel
        </LuiButton>
        <LuiButton onClick={renumberPage}>Continue</LuiButton>
      </LuiModalV2.Buttons>
    </LuiModalV2>
  );
};

const DeleteModal = ({ closeModal, pageInfo, callback }: IPopupModal) => (
  <LuiAlertModalV2
    level="warning"
    shouldCloseOnOverlayClick
    headingText="Delete page?"
    helpLink="https://www.linz.govt.nz/"
    onClose={closeModal}
  >
    <p>
      Are you sure you want to remove {pageInfo.activeSheet.toUpperCase()} Page {pageInfo.activePageNumber}?
    </p>
    <LuiModalV2.Buttons>
      <LuiButton level="tertiary" onClick={closeModal}>
        Cancel
      </LuiButton>
      <LuiButton
        level="tertiary"
        onClick={() => {
          callback(pageInfo.activePageNumber);
          closeModal();
        }}
      >
        Delete
      </LuiButton>
    </LuiModalV2.Buttons>
  </LuiAlertModalV2>
);

export default PageManager;
