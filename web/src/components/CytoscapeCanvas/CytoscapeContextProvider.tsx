import cytoscape from "cytoscape";
import React, { createContext, ReactElement, ReactNode, useEffect, useState } from "react";

import { cytoscapeUtils, GraphActionsProps } from "@/util/cytoscapeUtil.ts";

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
  applyGraphOptions: (options: GraphActionsProps) => void;
}

export const CytoscapeContext = createContext<CytoscapeContextType | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export const CytoscapeContextProvider = (props: ProviderProps): ReactElement | null => {
  const [cyto, setCyto] = useState<cytoscape.Core>();
  const [isMaxZoom, setIsMaxZoom] = useState(false);
  const [isMinZoom, setIsMinZoom] = useState(false);
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
  const applyGraphOptions = (options: GraphActionsProps) => cytoscapeUtils.applyGraphOptions(options, cyto);

  const checkZoomLimits = () => {
    if (cyto) {
      const currentZoom = cyto.zoom();
      const maxZoom = cyto.maxZoom();
      const minZoom = cyto.minZoom();
      setIsMaxZoom(currentZoom >= maxZoom);
      setIsMinZoom(currentZoom <= minZoom);
    }
  };

  useEffect(() => {
    if (cyto) {
      cyto.on("zoom", checkZoomLimits);
      checkZoomLimits();
    }
    return () => {
      if (cyto) {
        cyto.removeListener("zoom", checkZoomLimits);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cyto]);

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
        applyGraphOptions,
      }}
    >
      {props.children}
    </CytoscapeContext.Provider>
  );
};
