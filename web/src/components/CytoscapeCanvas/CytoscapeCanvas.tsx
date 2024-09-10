import "./CytoscapeCanvas.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { LuiTooltip } from "@linzjs/lui";
import cytoscape from "cytoscape";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  getEdgeData,
  getNodeData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { NoPageMessage } from "@/components/Footer/NoPageMessage.tsx";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext.ts";
import { useOnKeyDownAndMouseDown } from "@/hooks/useOnKeyDown.ts";
import { useThrowAsyncError } from "@/hooks/useThrowAsyncError";
import { getActivePages } from "@/redux/planSheets/planSheetsSlice.ts";
import { isPlaywrightTest, saveCytoscapeStateToStorage } from "@/test-utils/playwright-utils";
import { MAX_ZOOM, MIN_ZOOM } from "@/util/cytoscapeUtil.ts";

export interface IInitZoom {
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface ICytoscapeCanvasProps {
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  diagrams: DiagramDTO[];
  initZoom?: IInitZoom;
  onNodeChange: (node: INodeData) => void;
  onEdgeChange: (node: IEdgeData) => void;
  onCyInit?: (cy: cytoscape.Core) => void;
  "data-testid"?: string;
}

const CytoscapeCanvas = ({
  nodeData,
  edgeData,
  diagrams,
  initZoom,
  onNodeChange,
  onEdgeChange,
  onCyInit,
  "data-testid": dataTestId,
}: ICytoscapeCanvasProps) => {
  const throwAsyncError = useThrowAsyncError();
  const activePages = useAppSelector(getActivePages);
  const testId = dataTestId ?? "CytoscapeCanvas";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core>();
  const [zoom, setZoom] = useState<number>(initZoom?.zoom ?? 1);
  const [pan, setPan] = useState<cytoscape.Position>(initZoom?.pan ?? { x: 0, y: 0 });

  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const { setCyto, scrollToZoom, zoomToSelectedRegion, keepPanWithinBoundaries, onViewportChange } =
    useCytoscapeContext();
  const startCoordsRef = useRef({ x1: 0, y1: 0 });

  const onMouseOver = (event: cytoscape.EventObject) => {
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
  const onMouseOut = () => {
    setTooltipContent(null);
    setTooltipPosition(null);
  };
  const enableZoomToArea = () => {
    cy?.userPanningEnabled(false);
  };
  const onMouseDown = (event: cytoscape.EventObject) => {
    startCoordsRef.current.x1 = event.position.x;
    startCoordsRef.current.y1 = event.position.y;
  };
  const onMouseUp = (event: cytoscape.EventObject) => {
    if (!cy?.userPanningEnabled()) {
      zoomToSelectedRegion(startCoordsRef.current.x1, startCoordsRef.current.y1, event.position.x, event.position.y);
      cy?.userPanningEnabled(true);
    }
  };

  const initCytoscape = useCallback(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::initCytoscape - no canvas");
    }
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasRef.current, diagrams);

    const cyRef = cytoscape({
      container: canvasRef.current,
      zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
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

    if (onCyInit && !cy) {
      onCyInit(cyRef);
    }
    setCy(cyRef);
    setCyto(cyRef);

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
    if (!activePages.length) {
      return; // Exit if there are no pages
    }

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
  }, [activePages.length, initCytoscape]);

  // Listen and handle cytoscape events
  useEffect(() => {
    const emitChange = (event: cytoscape.EventObject) => {
      try {
        if (event.target.isNode()) {
          const node = event.target as cytoscape.NodeSingular;
          if (!canvasRef.current) {
            throw Error("CytoscapeCanvas::emitChange listener - no viewport");
          }
          const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasRef.current, diagrams);
          onNodeChange(getNodeData(node, cytoscapeCoordinateMapper));
        } else {
          const edge = event.target as cytoscape.EdgeSingular;
          onEdgeChange(getEdgeData(edge));
        }
      } catch (error) {
        throwAsyncError(error as Error);
      }
    };
    cy?.addListener(["add", "remove", "data"].join(" "), emitChange); // For multiple events they must be space seperated
    cy?.addListener("position", debounce(emitChange, 1000)); // 1s debounce since lots of position events are fired very quickly

    cy?.addListener("zoom", (event: cytoscape.EventObject) => setZoom(event.cy.zoom()));
    cy?.addListener("pan", (event: cytoscape.EventObject) => setPan(event.cy.pan()));

    cy?.addListener("mouseover", "node", onMouseOver);
    cy?.addListener("mouseout", "node", onMouseOut);
    cy?.addListener("mousedown", onMouseDown);
    cy?.addListener("mouseup", onMouseUp);
    cy?.on("dragpan", (event) => keepPanWithinBoundaries(event.cy));
    cy?.on("scrollzoom", (event) => scrollToZoom(event.cy));
    cy?.on("viewport", (event) => onViewportChange(event.cy));

    return () => {
      cy?.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, onNodeChange, onEdgeChange, canvasRef.current]);

  // Shift + right-click to zoom into an area
  useOnKeyDownAndMouseDown(
    ({ shiftKey }) => shiftKey,
    ({ button }) => button === 0,
    enableZoomToArea,
  );

  return (
    <>
      {activePages.length ? (
        <div className="CytoscapeCanvas" style={{ cursor: "default" }} data-testid={testId} ref={canvasRef} />
      ) : (
        <NoPageMessage />
      )}
      {tooltipContent && tooltipPosition && (
        <LuiTooltip content={tooltipContent} visible={true} placement="left" appendTo={() => document.body}>
          <div style={{ position: "absolute", top: tooltipPosition.y, left: tooltipPosition.x - 20 }} />
        </LuiTooltip>
      )}
    </>
  );
};

export default CytoscapeCanvas;
