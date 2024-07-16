import "./CytoscapeCanvas.scss";

import { IDiagram } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";

export interface IInitZoom {
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface ICytoscapeCanvasProps {
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  diagrams: IDiagram[];
  initZoom?: IInitZoom;
}

const CytoscapeCanvas = ({ nodeData, edgeData, diagrams, initZoom }: ICytoscapeCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [initDone, setInitDone] = useState<boolean>(false);

  const initCytoscape = useCallback(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::initCytoscape - no canvas");
    }
    const canvasViewport = { width: canvasRef.current.clientWidth, height: canvasRef.current.clientHeight };
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasViewport, diagrams);

    cytoscape({
      container: canvasRef.current,
      zoom: initZoom?.zoom ?? 1,
      pan: initZoom?.pan ?? { x: 0, y: 0 },
      elements: {
        nodes: nodeDefinitionsFromData(nodeData),
        edges: edgeDefinitionsFromData(edgeData),
      },
      layout: {
        name: "preset",
        fit: false,
        positions: nodePositionsFromData(nodeData, cytoscapeCoordinateMapper),
      },
      // the stylesheet for the graph
      style: makeCytoscapeStylesheet(cytoscapeCoordinateMapper),
    });
  }, [nodeData, edgeData, diagrams, initZoom]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (initDone || (nodeData.length === 0 && edgeData.length === 0)) {
      return;
    }

    initCytoscape();

    setInitDone(true);
  }, [initDone, edgeData, nodeData, initCytoscape]);

  useEffect(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::setup observer - no viewport");
    }

    // We want to call initCytoscape directly but after a short delay
    const ms20 = 20;
    const debouncedInitCytoscape = debounce(initCytoscape, ms20);

    const resizeObserver = new ResizeObserver(() => {
      debouncedInitCytoscape();
    });
    resizeObserver.observe(canvasRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [initCytoscape]);

  return <div className="CytoscapeCanvas" data-testid="CytoscapeCanvas" ref={canvasRef} />;
};

export default CytoscapeCanvas;
