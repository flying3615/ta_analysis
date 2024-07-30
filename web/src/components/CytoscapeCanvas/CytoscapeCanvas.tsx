import "./CytoscapeCanvas.scss";

import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { LuiTooltip } from "@linzjs/lui";
import cytoscape from "cytoscape";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDataFromDefinitions,
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDataFromDefinitions,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { isPlaywrightTest, saveCytoscapeStateToStorage } from "@/test-utils/playwright-utils";

export interface IInitZoom {
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface ICytoscapeCanvasProps {
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  diagrams: IDiagram[];
  initZoom?: IInitZoom;
  onChange: (data: { nodeData: INodeData[]; edgeData: IEdgeData[] }) => void;
  onCyInit?: (cy: cytoscape.Core) => void;
  "data-testid"?: string;
}

const CytoscapeCanvas = ({
  nodeData,
  edgeData,
  diagrams,
  initZoom,
  onChange,
  onCyInit,
  "data-testid": dataTestId,
}: ICytoscapeCanvasProps) => {
  const testId = dataTestId ?? "CytoscapeCanvas";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core>();
  const [zoom, setZoom] = useState<number>(initZoom?.zoom ?? 1);
  const [pan, setPan] = useState<cytoscape.Position>(initZoom?.pan ?? { x: 0, y: 0 });

  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseOver = (event: cytoscape.EventObject) => {
    const node = event.target;
    if (node.id() === "border_page_no") {
      const { x, y } = node.renderedPosition();

      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setTooltipContent("Reserved for sheet numbers");
        setTooltipPosition({ x: x + canvasRect.left, y: y + canvasRect.top });
      }
    }
  };

  const handleMouseOut = () => {
    setTooltipContent(null);
    setTooltipPosition(null);
  };

  const initCytoscape = useCallback(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::initCytoscape - no canvas");
    }

    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasRef.current, diagrams);

    const cyRef = cytoscape({
      container: canvasRef.current,
      zoom,
      pan,
      elements: {
        nodes: nodeDefinitionsFromData(nodeData, cytoscapeCoordinateMapper),
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

    setCy(cyRef);

    if (onCyInit) {
      onCyInit(cyRef);
    }

    if (isPlaywrightTest()) {
      saveCytoscapeStateToStorage(cyRef, testId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeData, edgeData, diagrams, initZoom]);

  // Set up cytoscape instance
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (cy || (nodeData.length === 0 && edgeData.length === 0)) {
      return;
    }

    initCytoscape();
  }, [cy, edgeData, nodeData, initCytoscape]);

  // Handle viewport resizing
  useEffect(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::resize observer - no viewport");
    }

    const debouncedInitCytoscape = debounce(initCytoscape, 20);

    const resizeObserver = new ResizeObserver(() => {
      debouncedInitCytoscape();
    });
    resizeObserver.observe(canvasRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [initCytoscape]);

  // Listen and handle cytoscape events
  useEffect(() => {
    const emitChange = (event: cytoscape.EventObject) => {
      if (!canvasRef.current) {
        throw Error("CytoscapeCanvas::event listener - no viewport");
      }

      const json = event.cy.json() as {
        elements: { nodes: cytoscape.NodeDefinition[]; edges: cytoscape.EdgeDefinition[] };
      };

      const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasRef.current, diagrams);
      const nodeData = nodeDataFromDefinitions(json.elements.nodes, cytoscapeCoordinateMapper);
      const edgeData = edgeDataFromDefinitions(json.elements.edges);

      onChange({ nodeData, edgeData });
    };

    cy?.addListener(["add", "remove", "data"].join(" "), emitChange); // For multiple events they must be space seperated
    cy?.addListener("position", debounce(emitChange, 1000)); // 1s debounce since lots of position events are fired very quickly

    cy?.addListener("zoom", (event: cytoscape.EventObject) => setZoom(event.cy.zoom()));
    cy?.addListener("pan", (event: cytoscape.EventObject) => setPan(event.cy.pan()));

    cy?.addListener("mouseover", "node", handleMouseOver);
    cy?.addListener("mouseout", "node", handleMouseOut);

    return () => {
      cy?.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, onChange, canvasRef.current]);

  return (
    <>
      <div className="CytoscapeCanvas" data-testid={testId} ref={canvasRef} />
      {tooltipContent && tooltipPosition && (
        <LuiTooltip content={tooltipContent} visible={true} placement="left" appendTo={() => document.body}>
          <div style={{ position: "absolute", top: tooltipPosition.y, left: tooltipPosition.x - 20 }} />
        </LuiTooltip>
      )}
    </>
  );
};

export default CytoscapeCanvas;
