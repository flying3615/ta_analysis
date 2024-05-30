import "./CytoscapeCanvas.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import {
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import cytoscapeStylesheet from "@/components/CytoscapeCanvas/cytoscapeStylesheet.ts";
import { debounce } from "lodash-es";
import { IDiagram } from "@linz/survey-plan-generation-api-client";

export interface ICytoscapeCanvasProps {
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  diagrams: IDiagram[];
}

const CytoscapeCanvas = ({ nodeData, edgeData, diagrams }: ICytoscapeCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [initDone, setInitDone] = useState<boolean>(false);

  const initCytoscape = useCallback(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::initCytoscape - no canvas");
    }

    cytoscape({
      container: canvasRef.current,
      elements: {
        nodes: nodeDefinitionsFromData(nodeData),
        edges: edgeDefinitionsFromData(edgeData),
      },
      layout: {
        name: "preset",
        fit: false,
        positions: nodePositionsFromData(
          nodeData,
          { width: canvasRef.current.clientWidth, height: canvasRef.current.clientHeight },
          diagrams,
        ),
      },
      // the stylesheet for the graph
      style: cytoscapeStylesheet,
    });
  }, [nodeData, edgeData, diagrams]);

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
      throw Error("CytoscapeCanvas::setup aobserver - no viewport");
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
