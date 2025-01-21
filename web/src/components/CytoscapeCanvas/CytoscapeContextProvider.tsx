import cytoscape from "cytoscape";
import React, { createContext, ReactElement, ReactNode, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setSelectedElementIds } from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

export interface CytoscapeContextType {
  cyto?: cytoscape.Core;
  setCyto: (cy: cytoscape.Core) => void;
  isMaxZoom: boolean;
  isMinZoom: boolean;
  zoomToFit: () => void;
  zoomByDelta: (delta: number) => void;
  zoomToSelectedRegion: (x1: number, y1: number, x2: number, y2: number) => void;
  scrollToZoom: (cy: cytoscape.Core) => void;
  keepPanWithinBoundaries: (cy: cytoscape.Core) => void;
  onViewportChange: (cy: cytoscape.Core) => void;
  keepElementSelected: (callback: () => void) => void;
  cleanupSelectedElements: (callback: () => void) => void;
  setSelectedElementIds: (ids: string[]) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CytoscapeContext = createContext<CytoscapeContextType | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export const CytoscapeContextProvider = (props: ProviderProps): ReactElement | null => {
  const [cyto, setCyto] = useState<cytoscape.Core>();
  const [isMaxZoom, setIsMaxZoom] = useState(false);
  const [isMinZoom, setIsMinZoom] = useState(false);
  const dispatch = useAppDispatch();
  const zoomToFit = () => cytoscapeUtils.zoomToFit(cyto);
  const zoomByDelta = (delta: number) => {
    cytoscapeUtils.zoomByDelta(delta, cyto);
    checkZoomLimits();
  };
  const zoomToSelectedRegion = (x1: number, y1: number, x2: number, y2: number) =>
    cytoscapeUtils.zoomToSelectedRegion(x1, y1, x2, y2, cyto);
  const scrollToZoom = (cy: cytoscape.Core) => cytoscapeUtils.scrollToZoom(cy);
  const keepPanWithinBoundaries = (cy: cytoscape.Core) => cytoscapeUtils.keepPanWithinBoundaries(cy);
  const onViewportChange = (cy: cytoscape.Core) => cytoscapeUtils.onViewportChange(cy);
  const selectedElementIds = useAppSelector((state) => state.planSheets.v1.selectedElementIds);

  const checkZoomLimits = () => {
    if (!cyto) return;

    const currentZoom = cyto.zoom();
    const maxZoom = cyto.maxZoom();
    const minZoom = cyto.minZoom();
    setIsMaxZoom(currentZoom >= maxZoom);
    setIsMinZoom(currentZoom <= minZoom);
  };

  const keepElementSelected = (callback: () => void) => {
    const selectedElements = cyto?.$(":selected");
    const selectedIds = selectedElements?.map((ele) => ele.id());
    dispatch(setSelectedElementIds(selectedIds ?? []));
    callback();
  };

  const cleanupSelectedElements = (callback: () => void) => {
    dispatch(setSelectedElementIds([]));
    callback();
  };

  useEffect(() => {
    if (!cyto || !selectedElementIds) return;
    selectedElementIds.forEach((id) => {
      cyto.$(`#${id}`).select();
    });
  }, [cyto, selectedElementIds, dispatch]);

  return (
    <CytoscapeContext.Provider
      value={{
        cyto,
        setCyto,
        isMaxZoom,
        isMinZoom,
        zoomToFit,
        zoomByDelta,
        zoomToSelectedRegion,
        scrollToZoom,
        keepPanWithinBoundaries,
        onViewportChange,
        keepElementSelected,
        cleanupSelectedElements,
        setSelectedElementIds,
      }}
    >
      {props.children}
    </CytoscapeContext.Provider>
  );
};
