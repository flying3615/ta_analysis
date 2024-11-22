import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";
import { useCallback, useMemo } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  getCytoscapeDataToNodeAndEdgeData,
  INodeAndEdgeData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { updateDiagramsWithEdge, updateDiagramsWithNode, updatePageWithNode } from "@/modules/plan/updatePlanData";
import { getActivePage, replaceDiagramsAndPage } from "@/redux/planSheets/planSheetsSlice";

import { useAppDispatch, useAppSelector } from "./reduxHooks";
import { useCytoscapeContext } from "./useCytoscapeContext";

export interface PlanSheetsDispatch {
  cytoCanvas: HTMLElement | undefined;
  cyto: cytoscape.Core | undefined;
  cytoCoordMapper: CytoscapeCoordinateMapper | undefined;
  cytoDataToNodeAndEdgeData: (cytoData: CollectionReturnValue | EdgeSingular | NodeSingular) => INodeAndEdgeData;
  updateActiveDiagramsAndPage: (elements: Partial<INodeAndEdgeData>) => void;
  updateActiveDiagramsAndPageFromCytoData: (cytoData: CollectionReturnValue | EdgeSingular | NodeSingular) => void;
}

export function usePlanSheetsDispatch(): PlanSheetsDispatch {
  const { cyto } = useCytoscapeContext();
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const activePage = useAppSelector(getActivePage);
  const dispatch = useAppDispatch();
  const cytoCanvas = cyto?.container() || undefined;

  const cytoCoordMapper = useMemo((): CytoscapeCoordinateMapper | undefined => {
    if (!cytoCanvas) {
      return;
    }
    return new CytoscapeCoordinateMapper(cytoCanvas, activeDiagrams);
  }, [cytoCanvas, activeDiagrams]);

  const cytoDataToNodeAndEdgeData = useCallback(
    (cytoscapeData: CollectionReturnValue | EdgeSingular | NodeSingular): INodeAndEdgeData => {
      return getCytoscapeDataToNodeAndEdgeData(cytoCoordMapper, cytoscapeData);
    },
    [cytoCoordMapper],
  );

  const updateActiveDiagramsAndPage = useCallback(
    (elements: Partial<INodeAndEdgeData>) => {
      let updatedDiagrams = activeDiagrams;
      let updatedPage = activePage;

      elements.edges?.forEach((edge) => {
        if (edge.properties.diagramId) {
          updatedDiagrams = updateDiagramsWithEdge(updatedDiagrams, edge);
        } else {
          console.warn("update page edge not implemented");
        }
      });
      elements.nodes?.forEach((node) => {
        if (node.properties.diagramId) {
          updatedDiagrams = updateDiagramsWithNode(updatedDiagrams, node);
        } else if (updatedPage) {
          updatedPage = updatePageWithNode(updatedPage, node);
        }
      });

      if (updatedDiagrams !== activeDiagrams || (updatedPage && updatedPage !== activePage)) {
        dispatch(replaceDiagramsAndPage({ diagrams: updatedDiagrams, page: updatedPage }));
      }
    },
    [activeDiagrams, activePage, dispatch],
  );

  const updateActiveDiagramsAndPageFromCytoData = useCallback(
    (cytoscapeData: CollectionReturnValue | EdgeSingular | NodeSingular): void => {
      updateActiveDiagramsAndPage(cytoDataToNodeAndEdgeData(cytoscapeData));
    },
    [cytoDataToNodeAndEdgeData, updateActiveDiagramsAndPage],
  );

  return {
    cyto,
    cytoCanvas,
    cytoCoordMapper,
    cytoDataToNodeAndEdgeData,
    updateActiveDiagramsAndPage,
    updateActiveDiagramsAndPageFromCytoData,
  };
}
