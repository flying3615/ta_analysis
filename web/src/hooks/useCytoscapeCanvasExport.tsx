import { useToast } from "@linzjs/lui";
import { PromiseWithResolve, useLuiModalPrefab } from "@linzjs/windows";
import cytoscape, { ExportBlobOptions } from "cytoscape";
import React, { useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData.ts";
import { getActiveSheet, getDiagrams, getPages } from "@/redux/planSheets/planSheetsSlice.ts";
import { downloadBlob } from "@/util/downloadHelper.ts";
import { promiseWithTimeout } from "@/util/promiseUtil.ts";
import PreviewWorker from "@/workers/previewWorker?worker";

export interface CytoscapeCanvasExport {
  startProcessing: () => Promise<void>;
  ExportingCanvas: React.FC;
  processing: boolean;
  stopProcessing: () => void;
}

export interface PNGFile {
  name: string;
  blob: Blob;
}

const cyPngConfig = {
  full: true,
  output: "blob",
  bg: "#fff",
  maxWidth: 9921,
  maxHeight: 7016,
} as ExportBlobOptions;

enum PlanSheetTypeAbbreviation {
  TITLE_PLAN_TITLE = "DTPS",
  SURVEY_PLAN_TITLE = "DSPT",
  SURVEY_PLAN_SURVEY = "DSPS",
}

export const useCytoscapeCanvasExport = (): CytoscapeCanvasExport => {
  const { error: errorToast } = useToast();
  const diagrams = useAppSelector(getDiagrams);
  const activeSheet = useAppSelector(getActiveSheet);
  const pages = useAppSelector(getPages);

  const canvasRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();

  const [processing, setProcessing] = useState<boolean>(false);
  let worker = new PreviewWorker();
  const processingModal = useRef<PromiseWithResolve<boolean>>();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    if (!processing) {
      // Close it when exporting is done
      processingModal.current?.resolve(false);
    }
  }, [processing]);

  const ExportingCanvas = () => {
    useEffect(() => {
      if (!canvasRef.current) {
        throw Error("CytoscapeCanvas::initCytoscape - not ready");
      }
      cyRef.current = cytoscape({
        container: canvasRef.current,
        layout: { name: "grid", boundingBox: { x1: 0, y1: 0, x2: 0, y2: 0 } },
      });
    }, []);

    return (
      <div ref={modalOwnerRef} style={{ width: "1px", height: "1px", background: "transparent" }}>
        <div data-testid="cy-exporting-canvas" ref={canvasRef}></div>
      </div>
    );
  };

  const startProcessing = async () => {
    if (!cyRef.current || !canvasRef.current) {
      console.error("cytoscape instance is not available");
      return;
    }

    // Don't block the exporting process
    showProcessingModal().then();

    setProcessing(true);
    const cyRefCurrent = cyRef.current;

    // find the max pageNumber for the given activeSheet type like survey or title
    const activePlanSheetPages = pages.filter((p) => p.pageType == activeSheet);
    const maxPageNumber = Math.max(...activePlanSheetPages.map((p) => p.pageNumber));
    const sheetName =
      activeSheet === PlanSheetType.TITLE.valueOf()
        ? PlanSheetTypeAbbreviation.SURVEY_PLAN_TITLE
        : PlanSheetTypeAbbreviation.SURVEY_PLAN_SURVEY;

    try {
      const pngs: PNGFile[] = [];
      for (let i = 1; i <= maxPageNumber; i++) {
        const imageName = `${sheetName}-${i}.png`;
        const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == i)?.id;

        if (!currentPageId) {
          continue;
        }

        const currentPageDiagrams = diagrams.filter((d) => d.pageRef == currentPageId);

        const diagramNodeData = extractDiagramNodes(currentPageDiagrams);
        const diagramEdgeData = extractDiagramEdges(currentPageDiagrams);

        const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
          canvasRef.current,
          diagrams,
          window.innerWidth,
          window.innerHeight,
        );

        cyRefCurrent.add({
          nodes: nodeDefinitionsFromData(diagramNodeData, cytoscapeCoordinateMapper),
          edges: edgeDefinitionsFromData(diagramEdgeData),
        });

        const nodeBgPromise = cyRefCurrent?.nodes().promiseOn("background");

        const stylePromise = cyRefCurrent?.promiseOn("style");

        cyRefCurrent?.style(makeCytoscapeStylesheet(cytoscapeCoordinateMapper)).update();

        const layoutPromise = cyRefCurrent?.promiseOn("layoutstop");

        cyRefCurrent
          .layout({
            name: "preset",
            fit: false,
            positions: nodePositionsFromData(diagramNodeData, cytoscapeCoordinateMapper),
          })
          .run();

        // wait 10s for style, layout and node bg images applied
        await Promise.all([stylePromise, layoutPromise, nodeBgPromise].map((p) => promiseWithTimeout(p, 10000)));

        pngs.push({ name: imageName, blob: cyRefCurrent.png(cyPngConfig) });

        // remove all elements for the next page rendering
        cyRefCurrent.remove(cyRefCurrent.elements());
      }

      worker.postMessage(pngs);
      worker.onmessage = async (e) => {
        const { type, payload } = e.data;

        switch (type) {
          case "DOWNLOAD":
            downloadBlob(payload.processedBlob, payload.name);
            break;
          case "COMPLETED":
            console.log("COMPLETED", payload);
            break;
        }

        setProcessing(false);
        cyRefCurrent?.destroy();
      };
      worker.onerror = (e) => {
        console.error(e);
        setProcessing(false);
      };
    } catch (e) {
      errorToast("An error occurred while previewing the layout.");
      setProcessing(false);
    }
  };

  const stopProcessing = () => {
    // terminate the current worker and create a new one for next execution
    worker.terminate();
    worker = new PreviewWorker();
    setProcessing(false);
  };

  const showProcessingModal = async () => {
    processingModal.current = showPrefabModal({
      style: { width: 200 },
      level: "progress",
      title: "Processing...",
      children: "Preparing preview of Layout Plan Sheets.",
      buttons: [{ title: "Cancel", value: true }],
    });

    const canceled = await processingModal.current.then();
    if (canceled) {
      // user interrupted the process
      stopProcessing();
    }
  };

  //test purpose

  return {
    startProcessing,
    ExportingCanvas,
    processing,
    stopProcessing,
  };
};
