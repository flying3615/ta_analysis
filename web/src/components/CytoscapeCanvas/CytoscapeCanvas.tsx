import "./CytoscapeCanvas.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";
import { debounce, isArray } from "lodash-es";
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

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
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { NoPageMessage } from "@/components/Footer/NoPageMessage.tsx";
import { PageLabelInput } from "@/components/PageLabelInput/PageLabelInput";
import { PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext.ts";
import { useCytoscapeContextMenu } from "@/hooks/useCytoscapeContextMenu.ts";
import { useOnKeyDownAndMouseDown } from "@/hooks/useOnKeyDown.ts";
import { useThrowAsyncError } from "@/hooks/useThrowAsyncError";
import { getActivePages } from "@/redux/planSheets/planSheetsSlice.ts";
import { isPlaywrightTest, isStorybookTest, saveCytoscapeStateToStorage } from "@/test-utils/cytoscape-data-utils.ts";
import { MAX_ZOOM, MIN_ZOOM } from "@/util/cytoscapeUtil.ts";

import { CytoscapeContextMenu } from "./CytoscapeContextMenu";

export interface IInitZoom {
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface ICytoscapeCanvasProps extends PropsWithChildren {
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  diagrams: DiagramDTO[];
  initZoom?: IInitZoom;
  onNodeChange: (node: INodeData) => void;
  onEdgeChange: (node: IEdgeData) => void;
  onCyInit?: (cy: cytoscape.Core) => void;
  applyClasses?: Record<string, string | string[]>;
  selectionSelector?: string;
  getContextMenuItems: (element: NodeSingular | EdgeSingular | cytoscape.Core) => MenuItem[] | undefined;
  "data-testid"?: string;
}

const CytoscapeCanvas = ({
  children,
  nodeData,
  edgeData,
  diagrams,
  initZoom,
  onNodeChange,
  onEdgeChange,
  onCyInit,
  applyClasses,
  selectionSelector,
  getContextMenuItems,
  "data-testid": dataTestId,
}: ICytoscapeCanvasProps) => {
  const throwAsyncError = useThrowAsyncError();
  const activePages = useAppSelector(getActivePages);

  const testId = dataTestId ?? "CytoscapeCanvas";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core>();
  const [cytoCoorMapper, setCytoCoordMapper] = useState<CytoscapeCoordinateMapper>();
  const [zoom, setZoom] = useState<number>(initZoom?.zoom ?? 1);
  const [pan, setPan] = useState<cytoscape.Position>(initZoom?.pan ?? { x: 0, y: 0 });

  const { setCyto, zoomToSelectedRegion, scrollToZoom, keepPanWithinBoundaries, onViewportChange } =
    useCytoscapeContext();

  const startCoordsRef = useRef({ x1: 0, y1: 0 });

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

  const labelTypesWithRelatedElements = ["lineLabels", "coordinateLabels"];

  const onSelected = (event: cytoscape.EventObject) => {
    const nodeData = event.target.data();
    if (labelTypesWithRelatedElements.includes(nodeData.elementType)) {
      event.cy.$(`edge[id*='${nodeData.featureId}_'], node[id='${nodeData.featureId}']`).forEach((ele) => {
        ele.addClass(PlanStyleClassName.RelatedLabelSelected);
      });
    }
  };

  const onUnselected = (event: cytoscape.EventObject) => {
    const nodeData = event.target.data();
    if (labelTypesWithRelatedElements.includes(nodeData.elementType)) {
      const selectedElements = event.cy.$(":selected");
      event.cy.$(`edge[id*='${nodeData.featureId}_'], node[id='${nodeData.featureId}']`).forEach((ele) => {
        //only remove the class if no other labels are selected with this related feature
        //e.g. some lines can have two labels (bearing/distance)
        selectedElements.filter((x) => x.data().featureId == nodeData.featureId).length == 0 &&
          ele.removeClass(PlanStyleClassName.RelatedLabelSelected);
      });
    }
  };

  const enableZoomToArea = () => {
    cy?.userPanningEnabled(false);
  };

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

  const initCytoscape = useCallback(() => {
    if (!canvasRef.current) {
      throw Error("CytoscapeCanvas::initCytoscape - no canvas");
    }
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(canvasRef.current, diagrams);
    setCytoCoordMapper(cytoscapeCoordinateMapper);

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

    cyRef.nodes().ungrabify();
    cyRef.elements().unselectify();
    cyRef.elements().style("events", "no");
    if (selectionSelector) {
      cyRef.$(selectionSelector).selectify();
      cyRef.$(selectionSelector).style("events", "yes");
    }

    Object.entries(applyClasses ?? {}).forEach(([selector, classNames]) => {
      if (isArray(classNames)) {
        classNames.forEach((cn) => cyRef.elements(selector).addClass(cn));
      } else {
        cyRef.elements(selector).addClass(classNames);
      }
    });

    if (isPlaywrightTest() || isStorybookTest()) {
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
    // customized event listeners
    cy?.addListener("element:changed", emitChange);
    // builtin event listeners
    cy?.addListener(["add", "remove", "data"].join(" "), emitChange); // For multiple events they must be space seperated
    cy?.addListener("position", debounce(emitChange, 1000)); // 1s debounce since lots of position events are fired very quickly
    cy?.addListener("mousedown", onMouseDown);
    cy?.addListener("mouseup", onMouseUp);
    cy?.addListener("select", "node", onSelected);
    cy?.addListener("unselect", "node", onUnselected);
    cy?.addListener("zoom", (event: cytoscape.EventObject) => setZoom(event.cy.zoom()));
    cy?.addListener("pan", (event: cytoscape.EventObject) => setPan(event.cy.pan()));
    cy?.on("dragpan", (event) => keepPanWithinBoundaries(event.cy));
    cy?.on("scrollzoom", (event) => scrollToZoom(event.cy));
    cy?.on("viewport", (event) => onViewportChange(event.cy));

    return () => {
      cy?.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, onNodeChange, onEdgeChange, canvasRef.current]);

  // Shift + left-click to zoom into an area
  useOnKeyDownAndMouseDown(
    ({ shiftKey }) => shiftKey,
    ({ button }) => button === 0,
    enableZoomToArea,
  );

  const { menuState, hideMenu } = useCytoscapeContextMenu(cy, getContextMenuItems);

  return (
    <>
      {activePages.length ? (
        <>
          <div className="CytoscapeCanvas" data-testid={testId} ref={canvasRef} />
          <CytoscapeContextMenu menuState={menuState} hideMenu={hideMenu} />
          <PageLabelInput cy={cy} cytoCoordMapper={cytoCoorMapper} />
          {children}
        </>
      ) : (
        <NoPageMessage />
      )}
    </>
  );
};

export default CytoscapeCanvas;
