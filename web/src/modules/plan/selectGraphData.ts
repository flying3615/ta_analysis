import { DiagramDTO, PageConfigDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createSelector } from "@reduxjs/toolkit";

import { INodeAndEdgeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import {
  getActivePage,
  getConfigs,
  getDiagrams,
  getLastChangedAt,
  getLastModifiedAt,
  getPageConfigs,
  getPages,
  getPlanData,
  getSurveyCentre,
  UserEdit,
} from "@/redux/planSheets/planSheetsSlice";

import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageConfigEdges,
  extractPageConfigNodes,
  extractPageEdges,
  extractPageNodes,
  IDiagramToPage,
} from "./extractGraphData";
import { LookupGraphData } from "./LookupGraphData";

export interface INodeAndEdgeAndData<T> extends INodeAndEdgeData {
  data: T;
}

export const selectDiagramToPageLookupTable = createSelector(getPlanData, ({ diagrams, pages }) => {
  const lookupTbl: IDiagramToPage = {};
  diagrams.forEach((diagram) => {
    const correspondingPage = pages.find((pageItem) => pageItem.id === diagram.pageRef);
    if (correspondingPage) {
      lookupTbl[diagram.id] = {
        pageRef: diagram.pageRef,
        page: correspondingPage,
      };
    }
  });
  return lookupTbl;
});

export const selectActiveDiagrams = createSelector(getActivePage, getDiagrams, (activePage, diagrams): DiagramDTO[] =>
  diagrams.filter((diagram) => diagram.pageRef === activePage?.id),
);

export const selectActiveDiagramsEdgesAndNodes = createSelector(
  selectActiveDiagrams,
  selectDiagramToPageLookupTable,
  (activeDiagrams, lookupTbl): INodeAndEdgeAndData<DiagramDTO[]> => {
    return {
      data: activeDiagrams,
      edges: extractDiagramEdges(activeDiagrams),
      nodes: extractDiagramNodes(activeDiagrams, lookupTbl),
    };
  },
);

export const selectActivePageEdgesAndNodes = createSelector(
  getActivePage,
  (activePage): INodeAndEdgeAndData<PageDTO | undefined> => {
    return {
      data: activePage,
      edges: activePage ? extractPageEdges([activePage]) : [],
      nodes: activePage ? extractPageNodes([activePage]) : [],
    };
  },
);

export const selectLookupGraphData = createSelector(
  // NOTE: selecting using getDiagrams and getPages _seems_ more correct
  // however, this breaks the "getMenuItemsForPlanMode for Select coordinate returns coordinate menu";
  getPlanData,
  ({ diagrams, pages }) => new LookupGraphData({ diagrams, pages, configs: [] }),
);

export const selectLastUserEdit = createSelector(
  getDiagrams,
  getConfigs,
  getLastChangedAt,
  getLastModifiedAt,
  getSurveyCentre,
  getPages,
  (diagrams, configs, lastChangedAt, lastModifiedAt, surveyCentre, pages): UserEdit | undefined => {
    if (!configs || !lastChangedAt) {
      return undefined;
    }
    return {
      configs,
      diagrams,
      lastChangedAt,
      lastModifiedAt,
      pages,
      surveyCentreLatitude: surveyCentre?.y,
      surveyCentreLongitude: surveyCentre?.x,
    };
  },
);

export const selectPageConfigEdgesAndNodes = createSelector(
  getPageConfigs,
  (pageConfigs: PageConfigDTO[]): INodeAndEdgeAndData<PageConfigDTO[]> => ({
    data: pageConfigs,
    edges: extractPageConfigEdges(pageConfigs),
    nodes: extractPageConfigNodes(pageConfigs),
  }),
);
