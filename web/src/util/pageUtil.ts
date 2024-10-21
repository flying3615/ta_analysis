import { PageDTO } from "@linz/survey-plan-generation-api-client";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

export const getMaxPageId = (pages: PageDTO[]) => {
  return pages.reduce((maxId, page) => (page.id > maxId ? page.id : maxId), 0);
};

export const generateNewPageId = (getAllPages: PageDTO[]) => getMaxPageId(getAllPages) + 1;

interface PageUtilProps {
  activePageNumber?: number;
  getAllPages: PageDTO[];
  activePages?: PageDTO[];
  activeSheet: PlanSheetType;
}

interface NewPageResult {
  updatedPages?: PageDTO[];
  newPage: PageDTO;
}

export const newPageAtTheStart = ({ getAllPages, activeSheet }: PageUtilProps): NewPageResult | undefined => {
  const newPageId = getMaxPageId(getAllPages) + 1;
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

  return { updatedPages, newPage };
};

export const newPageAfterCurrent = ({
  activePageNumber,
  getAllPages,
  activeSheet,
}: PageUtilProps): NewPageResult | undefined => {
  if (!activePageNumber) return;

  const newPageNumber = activePageNumber + 1;
  const newPageId = generateNewPageId(getAllPages) + 1;
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
    updatedPages.findIndex((page) => page.pageNumber === newPageNumber && page.pageType === activeSheet),
    0,
    newPage,
  );

  return { updatedPages, newPage };
};

export const newPageAtTheEnd = ({
  activePages,
  getAllPages,
  activeSheet,
}: PageUtilProps): NewPageResult | undefined => {
  if (!activePages) return;
  const newPageNumber = activePages.length + 1;
  const newPageId = getMaxPageId(getAllPages) + 1;
  const newPage = {
    id: newPageId,
    pageType: activeSheet,
    pageNumber: newPageNumber,
  };

  return { newPage };
};
