import { DiagramDTO, PageConfigDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createSelector } from "@reduxjs/toolkit";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import {
  getActivePageNumber,
  getActiveSheet,
  getDiagrams,
  getDiagToPageLookupTbl,
  getPageConfigs,
  getPages,
} from "@/redux/planSheets/planSheetsSlice";

import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageConfigEdges,
  extractPageConfigNodes,
  extractPageEdges,
  extractPageNodes,
} from "./extractGraphData";

export interface INodeAndEdgeData<T> {
  data: T;
  edges: IEdgeData[];
  nodes: INodeData[];
}

const selectActivePage = createSelector(
  getActivePageNumber,
  getActiveSheet,
  getPages,
  (activePageNumber, activeSheet, pages): PageDTO | undefined =>
    pages.find((page) => page.pageType == activeSheet && page.pageNumber == activePageNumber),
);

export const selectActiveDiagramsEdgesAndNodes = createSelector(
  selectActivePage,
  getDiagrams,
  getDiagToPageLookupTbl,
  (activePage, diagrams, lookupTbl): INodeAndEdgeData<DiagramDTO[]> => {
    const activeDiagrams = diagrams.filter((diagram) => diagram.pageRef === activePage?.id);
    return {
      data: activeDiagrams,
      edges: extractDiagramEdges(activeDiagrams),
      nodes: extractDiagramNodes(activeDiagrams, lookupTbl),
    };
  },
);

export const selectActivePageEdgesAndNodes = createSelector(
  selectActivePage,
  (activePage): INodeAndEdgeData<PageDTO | undefined> => {
    return {
      data: activePage,
      edges: activePage ? extractPageEdges([activePage]) : [],
      nodes: activePage ? extractPageNodes([activePage]) : [],
    };
  },
);

export const selectPageConfigEdgesAndNodes = createSelector(
  getPageConfigs,
  (pageConfigs: PageConfigDTO[]): INodeAndEdgeData<PageConfigDTO[]> => ({
    data: pageConfigs,
    edges: extractPageConfigEdges(pageConfigs),
    nodes: extractPageConfigNodes(pageConfigs),
  }),
);
