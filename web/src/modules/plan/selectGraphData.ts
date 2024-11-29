import { DiagramDTO, PageConfigDTO, PageDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { createSelector } from "@reduxjs/toolkit";
import { max } from "lodash-es";

import { INodeAndEdgeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import {
  getActivePage,
  getConfigs,
  getDiagrams,
  getLastChangedAt,
  getPageConfigs,
  getPages,
  getPlanData,
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
  getPlanData,
  ({ diagrams, pages }) => new LookupGraphData({ diagrams, pages, configs: [] }),
);

export const selectLastUserEdit = createSelector(
  getDiagrams,
  getConfigs,
  getLastChangedAt,
  getPages,
  (diagrams, configs, lastChangedAt, pages): PlanResponseDTO | undefined => {
    if (!configs || !lastChangedAt) {
      return undefined;
    }
    return {
      configs,
      diagrams,
      lastModifiedAt: lastChangedAt,
      pages,
    };
  },
);

/**
 * Feature ids are unique plan-wide.
 *
 * @param planData current plan.
 * @returns maximum feature id plus one.
 */
export const selectMaxPlanId = createSelector(getPlanData, ({ diagrams, pages }): number => {
  const planIdFeatures = [
    ...diagrams.flatMap((diagram) => [
      diagram.childDiagrams?.flatMap((child) => child.labels),
      diagram.coordinateLabels,
      diagram.coordinates,
      diagram.labels,
      diagram.lineLabels,
      diagram.lines,
      diagram.parcelLabelGroups,
    ]),
    ...pages.flatMap((page) => [page.coordinates, page.labels, page.lines]),
  ];

  const maxPlanId = planIdFeatures.reduce((maxPlanId, features) => {
    const maxId = max<number>(features?.map((data) => data.id));
    if (!maxId) {
      return maxPlanId;
    }
    return Math.max(maxPlanId, maxId);
  }, 0);

  return maxPlanId + 1;
});

export const selectPageConfigEdgesAndNodes = createSelector(
  getPageConfigs,
  (pageConfigs: PageConfigDTO[]): INodeAndEdgeAndData<PageConfigDTO[]> => ({
    data: pageConfigs,
    edges: extractPageConfigEdges(pageConfigs),
    nodes: extractPageConfigNodes(pageConfigs),
  }),
);
