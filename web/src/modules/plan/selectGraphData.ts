import { DiagramDTO, PageConfigDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createSelector } from "@reduxjs/toolkit";
import { max } from "lodash-es";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { getActivePage, getDiagrams, getPageConfigs, getPlanData } from "@/redux/planSheets/planSheetsSlice";

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

export interface INodeAndEdgeData<T> {
  data: T;
  edges: IEdgeData[];
  nodes: INodeData[];
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

export const selectActiveDiagramsEdgesAndNodes = createSelector(
  getActivePage,
  getDiagrams,
  selectDiagramToPageLookupTable,
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
  getActivePage,
  (activePage): INodeAndEdgeData<PageDTO | undefined> => {
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
  (pageConfigs: PageConfigDTO[]): INodeAndEdgeData<PageConfigDTO[]> => ({
    data: pageConfigs,
    edges: extractPageConfigEdges(pageConfigs),
    nodes: extractPageConfigNodes(pageConfigs),
  }),
);
