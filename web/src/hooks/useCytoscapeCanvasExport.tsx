import { useToast } from "@linzjs/lui";
import { PromiseWithResolve, useLuiModalPrefab } from "@linzjs/windows";
import cytoscape, { ExportBlobOptions } from "cytoscape";
import React, { useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData.ts";
import { getActiveSheet, getDiagrams, getPages } from "@/redux/planSheets/planSheetsSlice.ts";
import { downloadBlob } from "@/util/downloadHelper.ts";
import { createNewNode } from "@/util/mapUtil.ts";
import { promiseWithTimeout } from "@/util/promiseUtil.ts";
import PreviewWorker from "@/workers/previewWorker?worker";

export interface CytoscapeCanvasExport {
  startProcessing: (mode: "PREVIEW" | "COMPILATION") => Promise<void>;
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

export const useCytoscapeCanvasExport = (props: {
  pageConfigsEdgeData?: IEdgeData[];
  pageConfigsNodeData?: INodeData[];
}): CytoscapeCanvasExport => {
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

  const startProcessing = async (mode: "PREVIEW" | "COMPILATION") => {
    const cyRefCurrent = cyRef.current;

    if (!cyRefCurrent || !canvasRef.current) {
      console.error("cytoscape instance is not available");
      return;
    }

    // Don't block the exporting process
    showProcessingModal().then();

    setProcessing(true);

    // find the max pageNumber for the given activeSheet type like survey or title
    const activePlanSheetPages = pages.filter((p) => p.pageType == activeSheet);
    const maxPageNumber = Math.max(...activePlanSheetPages.map((p) => p.pageNumber));
    const sheetName =
      activeSheet === PlanSheetType.TITLE.valueOf()
        ? PlanSheetTypeAbbreviation.SURVEY_PLAN_TITLE
        : PlanSheetTypeAbbreviation.SURVEY_PLAN_SURVEY;

    const surveyInfoNodes = extractSurveyInfoNodeData();

    let nodeBgPromise, stylePromise, layoutPromise;
    cyRefCurrent?.one("add", () => {
      nodeBgPromise = cyRefCurrent?.nodes().promiseOn("background");
      stylePromise = cyRefCurrent?.promiseOn("style");
      layoutPromise = cyRefCurrent?.promiseOn("layoutstop");
    });

    try {
      const pngs: PNGFile[] = [];
      for (let i = 1; i <= maxPageNumber; i++) {
        const imageName = `${sheetName}-${i}.png`;
        const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == i)?.id;

        if (!currentPageId) {
          continue;
        }

        const currentPageDiagrams = diagrams.filter((d) => d.pageRef == currentPageId);

        const diagramNodeData = [
          ...surveyInfoNodes, // survey info text nodes
          ...(props.pageConfigsNodeData ?? []), // page frame and north compass nodes
          ...extractDiagramNodes(currentPageDiagrams), // diagram nodes
        ];
        const diagramEdgeData = [
          ...(props.pageConfigsEdgeData ?? []), // page frame edges
          ...extractDiagramEdges(currentPageDiagrams), // diagram edges
        ];
        const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
          canvasRef.current,
          diagrams,
          window.screen.width, // get user's screen max width and height
          window.screen.height,
          -50,
        );

        cyRefCurrent.add({
          nodes: nodeDefinitionsFromData(diagramNodeData, cytoscapeCoordinateMapper),
          edges: edgeDefinitionsFromData(diagramEdgeData),
        });

        cyRefCurrent?.style(makeCytoscapeStylesheet(cytoscapeCoordinateMapper)).update();

        cyRefCurrent
          .layout({
            name: "preset",
            fit: false,
            positions: nodePositionsFromData(diagramNodeData, cytoscapeCoordinateMapper),
          })
          .run();

        // wait 10s for style, layout and node bg images applied
        await Promise.all([stylePromise, layoutPromise, nodeBgPromise].map((p) => p && promiseWithTimeout(p, 10000)));

        const png = cyRefCurrent.png(cyPngConfig);
        // TODO for test
        // downloadBlob(png, imageName);
        pngs.push({ name: imageName, blob: png });

        // remove all elements for the next page rendering
        cyRefCurrent.remove(cyRefCurrent.elements());
      }

      if (mode === "PREVIEW") {
        await generatePreviewPDF(pngs);
      } else {
        await generateCompilation(pngs, cyRefCurrent);
      }
    } catch (e) {
      errorToast("An error occurred while previewing the layout.");
      console.error(e);
      setProcessing(false);
    } finally {
      cyRefCurrent?.off("add");
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

  const generateCompilation = async (pngs: PNGFile[], cyRefCurrent: cytoscape.Core) => {
    worker.postMessage({ type: "COMPILATION", PNGFiles: pngs });
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
  };

  const generatePreviewPDF = async (pngs: PNGFile[]) => {
    worker.postMessage({ type: "PREVIEW", PNGFiles: pngs });
    worker.onmessage = async (e) => {
      setProcessing(false);
      const { payload } = e.data;
      window.open(payload, "_blank");
    };
    worker.onerror = (e) => {
      console.error(e);
      setProcessing(false);
    };
  };

  const extractSurveyInfoNodeData = () => {
    // TODO to call backend api to get the survey info
    const TA_INFO1 = "Land District: Otago";
    const TA_INFO2 = "Digitally Generated Plan";
    const SURVEY_REF = "Education Purposes: error message";
    const SURVEYOR = "Surveyor: Jeremy";
    const CSD_NUM = "Record of Survey LT 602196";
    const infoNodes = [];
    props.pageConfigsNodeData?.sort((a, b) => {
      if (a.position.x === b.position.x) {
        return a.position.y - b.position.y;
      }
      return b.position.x - a.position.x;
    });
    if (props.pageConfigsNodeData) {
      const bottomRightNode = props.pageConfigsNodeData[0];
      if (bottomRightNode) {
        infoNodes.push(createNewNode(bottomRightNode, "survey_info_ta_info1", -35.5, 1.5, TA_INFO1));
        infoNodes.push(createNewNode(bottomRightNode, "survey_info_ta_info2", -35.5, 0.5, TA_INFO2));
        infoNodes.push(createNewNode(bottomRightNode, "survey_info_survey_ref", -25.5, 1, SURVEY_REF));
        infoNodes.push(createNewNode(bottomRightNode, "survey_info_surveyor", -11, 1, SURVEYOR));
        infoNodes.push(createNewNode(bottomRightNode, "survey_info_csd_number", -3.5, 1, CSD_NUM));
      }
    }

    return infoNodes;
  };

  return {
    startProcessing,
    ExportingCanvas,
    processing,
    stopProcessing,
  };
};
