import "./CytoscapeCanvas.scss";

import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";
import { debounce, isArray } from "lodash-es";
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useCytoscapeContextMenu } from "@/hooks/useCytoscapeContextMenu";
import { useOnKeyDownAndMouseDown } from "@/hooks/useOnKeyDown";
import { isStorybookTest, updateCytoscapeStateForTesting } from "@/test-utils/cytoscape-data-utils";
import { MAX_ZOOM, MIN_ZOOM } from "@/util/cytoscapeUtil";

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
  onCyInit?: (cy: cytoscape.Core) => void;
  applyClasses?: Record<string, string | string[]>;
  selectionSelector?: string;
  getContextMenuItems: (
    element: NodeSingular | EdgeSingular | cytoscape.Core,
    selectedCollection: CollectionReturnValue,
  ) => MenuItem[] | undefined;
  "data-testid"?: string;
}

const CytoscapeCanvas = ({
  children,
  nodeData,
  edgeData,
  diagrams,
  initZoom,
  onCyInit,
  applyClasses,
  selectionSelector,
  getContextMenuItems,
  "data-testid": dataTestId,
}: ICytoscapeCanvasProps) => {
  const testId = dataTestId ?? "CytoscapeCanvas";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core>();
  const [zoom, setZoom] = useState<number>(initZoom?.zoom ?? 1);
  const [pan, setPan] = useState<cytoscape.Position>(initZoom?.pan ?? { x: 0, y: 0 });

  const { setCyto, zoomToSelectedRegion, scrollToZoom, keepPanWithinBoundaries, onViewportChange } =
    useCytoscapeContext();

  const zoomEnabledRef = useRef(false);
  const startCoordsRef = useRef({ x1: 0, y1: 0 });

  const onMouseDown = (event: cytoscape.EventObject) => {
    if (zoomEnabledRef.current) {
      startCoordsRef.current.x1 = event.position.x;
      startCoordsRef.current.y1 = event.position.y;
    }
  };
  const onMouseUp = (event: cytoscape.EventObject) => {
    if (zoomEnabledRef.current) {
      zoomToSelectedRegion(startCoordsRef.current.x1, startCoordsRef.current.y1, event.position.x, event.position.y);
      cy?.userPanningEnabled(true);
      zoomEnabledRef.current = false;
    }
  };

  interface SelectRelatedData {
    elementType: PlanElementType;
    featureId: string;
  }
  const labelTypesWithRelatedElements = [PlanElementType.COORDINATE_LABELS, PlanElementType.LINE_LABELS];

  // NOTE: onSelected is called once for _every_ feature that is deselected
  const onSelected = (event: cytoscape.EventObjectEdge | cytoscape.EventObjectNode) => {
    const { elementType, featureId } = event.target.data() as Partial<SelectRelatedData>;
    if (!elementType || !featureId) {
      return;
    }
    if (labelTypesWithRelatedElements.includes(elementType)) {
      event.cy
        .$(`edge[id*='${featureId}_'], node[id='${featureId}']`)
        .addClass(PlanStyleClassName.RelatedLabelSelected);
    }
  };

  // NOTE: onUnselected is called once for _every_ feature that is deselected
  const onUnselected = (event: cytoscape.EventObjectEdge | cytoscape.EventObjectNode) => {
    const { elementType, featureId } = event.target.data() as Partial<SelectRelatedData>;
    if (!elementType || !featureId) {
      return;
    }
    if (labelTypesWithRelatedElements.includes(elementType)) {
      const selectedElements = event.cy.$(`:selected[elementType='${elementType}'][featureId=${featureId}]`);
      if (selectedElements.length == 0) {
        event.cy
          .$(`edge[id*='${featureId}_'], node[id='${featureId}']`)
          .removeClass(PlanStyleClassName.RelatedLabelSelected);
      }
    }
  };

  const enableZoomToArea = () => {
    zoomEnabledRef.current = true;
    cy?.userPanningEnabled(false);
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

    updateCytoscapeStateForTesting(cyRef, testId);
    if (isStorybookTest()) {
      window.cyRef = cyRef;
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
  }, [cy, canvasRef.current]);

  // Shift + left-click to zoom into an area
  useOnKeyDownAndMouseDown(
    ({ shiftKey }) => shiftKey,
    ({ button }) => button === 0,
    enableZoomToArea,
  );

  const { menuState, hideMenu } = useCytoscapeContextMenu(cy, getContextMenuItems);

  return (
    <>
      <div className="CytoscapeCanvas" data-testid={testId} ref={canvasRef} />
      <CytoscapeContextMenu menuState={menuState} hideMenu={hideMenu} />
      {children}
    </>
  );
};

export default CytoscapeCanvas;
