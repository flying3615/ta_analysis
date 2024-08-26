import { useToast } from "@linzjs/lui";
import { PromiseWithResolve, useLuiModalPrefab } from "@linzjs/windows";
import cytoscape, { ExportBlobOptions } from "cytoscape";
import { memoize } from "lodash-es";
import { DateTime } from "luxon";
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
import { ExternalSurveyInfoDto } from "@/queries/survey.ts";
import { getActiveSheet, getDiagrams, getPages } from "@/redux/planSheets/planSheetsSlice.ts";
import { downloadBlob } from "@/util/downloadHelper.ts";
import { createNewNode } from "@/util/mapUtil.ts";
import { promiseWithTimeout } from "@/util/promiseUtil.ts";
import { wrapText } from "@/util/stringUtil.ts";
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
  transactionId: number;
  surveyInfo: ExternalSurveyInfoDto;
  pageConfigsEdgeData?: IEdgeData[];
  pageConfigsNodeData?: INodeData[];
}): CytoscapeCanvasExport => {
  const { error: errorToast } = useToast();
  const diagrams = useAppSelector(getDiagrams);
  const activeSheet = useAppSelector(getActiveSheet);
  const pages = useAppSelector(getPages);

  const sortedNodes = useRef(
    props.pageConfigsNodeData?.sort((a, b) => {
      if (a.position.x === b.position.x) {
        return a.position.y - b.position.y;
      }
      return b.position.x - a.position.x;
    }),
  ).current;

  const canvasRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();

  const [processing, setProcessing] = useState<boolean>(false);
  let worker = new PreviewWorker();
  const processingModal = useRef<PromiseWithResolve<boolean>>();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    if (!processing) {
      processingModal.current?.resolve?.(false);
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
    const isSurveySheet = activeSheet === PlanSheetType.SURVEY.valueOf();
    const sheetName = isSurveySheet
      ? PlanSheetTypeAbbreviation.SURVEY_PLAN_SURVEY
      : PlanSheetTypeAbbreviation.SURVEY_PLAN_TITLE;
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      canvasRef.current,
      diagrams,
      window.screen.width, // get user's screen max width and height
      window.screen.height,
      -50,
    );

    // listen add action to wait for the node bg images, style & layout to be applied
    let nodeBgPromise, stylePromise, layoutPromise;
    cyRefCurrent?.one("add", () => {
      nodeBgPromise = cyRefCurrent?.nodes().promiseOn("background");
      stylePromise = cyRefCurrent?.promiseOn("style");
      layoutPromise = cyRefCurrent?.promiseOn("layoutstop");
    });

    try {
      const pngFiles: PNGFile[] = [];
      for (let currentPageNumber = 1; currentPageNumber <= maxPageNumber; currentPageNumber++) {
        const imageName = `${sheetName}-${currentPageNumber}.png`;
        const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == currentPageNumber)?.id;

        if (!currentPageId) {
          continue;
        }

        const currentPageDiagrams = diagrams.filter((d) => d.pageRef == currentPageId);
        const surveyInfoNodes = await extractSurveyInfoNodeData(
          props.surveyInfo,
          cytoscapeCoordinateMapper.scalePixelsPerCm,
          isSurveySheet,
          currentPageNumber,
          maxPageNumber,
        );

        const diagramNodeData = [
          ...surveyInfoNodes, // survey info text nodes
          ...(props.pageConfigsNodeData ?? []), // page frame and north compass nodes
          ...extractDiagramNodes(currentPageDiagrams), // diagram nodes
        ];

        const sheetType = activeSheet === PlanSheetType.TITLE.valueOf() ? "T" : "S";
        const secondaryBottomRightNode = sortedNodes && sortedNodes.length > 1 && sortedNodes[1];
        const pageInfoNode = secondaryBottomRightNode
          ? createNewNode(
              secondaryBottomRightNode,
              "border_page_no_preview",
              -1,
              0.5,
              `${sheetType} ${currentPageNumber}/${maxPageNumber}`,
            )
          : undefined;

        if (pageInfoNode) diagramNodeData.push(pageInfoNode);

        const diagramEdgeData = [
          ...(props.pageConfigsEdgeData ?? []), // page frame edges
          ...extractDiagramEdges(currentPageDiagrams), // diagram edges
        ];

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
        await Promise.all(
          [stylePromise, layoutPromise, nodeBgPromise].map(
            (p) => p && promiseWithTimeout(p, 10000, "wait for cytoscape rendering timedout"),
          ),
        );

        const png = cyRefCurrent.png(cyPngConfig);
        pngFiles.push({ name: imageName, blob: png });

        // remove all elements for the next page rendering
        cyRefCurrent.remove(cyRefCurrent.elements());
      }

      if (mode === "PREVIEW") {
        await generatePreviewPDF(pngFiles);
      } else {
        await generateCompilation(pngFiles, cyRefCurrent);
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

  const extractSurveyInfoNodeData = async (
    surveyInfo: ExternalSurveyInfoDto | undefined,
    scalePixelsPerCm: number,
    isSurveySheet: boolean,
    pageNum: number,
    totalPageNum: number,
  ): Promise<INodeData[]> => {
    const surveyInfoNodes: INodeData[] = [];

    if (!surveyInfo) {
      throw new Error("Could not query survey info");
    }

    if (!props.pageConfigsNodeData) {
      console.error("Invalid page config node data", props.pageConfigsNodeData);
      return surveyInfoNodes;
    }

    const date = DateTime.fromJSDate(new Date(surveyInfo.surveyDate));
    const formattedSurveyDate = date.toFormat("d LLLL yyyy");

    const TA_LOCALITY = `Land District: ${surveyInfo.localityName}`;
    const TA_CELL_TITLE = "Digitally Generated Plan";
    const GENERATED_DATE_TIME = `Generated on: ${DateTime.now()
      .toFormat("d MMM yyyy, h:mma")
      .replace(/(AM|PM)$/, (match) => match.toLowerCase())} – Page ${pageNum}/${totalPageNum}`;
    const SURVEY_REFERENCE = surveyInfo.description;
    const SURVEYOR_NAME = `Surveyor: ${surveyInfo.givenNames} ${surveyInfo.surname}`;
    const FIRM_NAME = `Firm: ${surveyInfo.corporateName}`;
    const SURVEY_DATE = `Date of Survey: ${formattedSurveyDate}`;
    const CSD_NUMBER_TITLE = `Record of ${surveyInfo.systemCodeDescription}`;
    const CSD_NUMBER = `${surveyInfo.datasetSeries} ${surveyInfo.datasetId}`;

    // Find the maximum y position
    const maxY = Math.min(...props.pageConfigsNodeData.map((node) => node.position.y));
    const bottomLineNodesAscByX = props.pageConfigsNodeData
      ?.filter((node) => node.position.y === maxY)
      .sort((a, b) => a.position.x - b.position.x);

    if (bottomLineNodesAscByX == undefined || bottomLineNodesAscByX.length != 5) {
      console.error("There is no bottom line nodes", bottomLineNodesAscByX);
      return surveyInfoNodes;
    }

    const bottomLineNodePosition0 = bottomLineNodesAscByX[0]!.position;
    const bottomLineNodePosition1 = bottomLineNodesAscByX[1]!.position;
    const bottomLineNodePosition2 = bottomLineNodesAscByX[2]!.position;
    const bottomLineNodePosition3 = bottomLineNodesAscByX[3]!.position;
    const bottomLineNodePosition4 = bottomLineNodesAscByX[4]!.position;

    const maxWidthCell1 = (bottomLineNodePosition1.x - bottomLineNodePosition0.x) * scalePixelsPerCm;
    const maxWidthCell2 = (bottomLineNodePosition2.x - bottomLineNodePosition1.x) * scalePixelsPerCm;
    const maxWidthCell3 = (bottomLineNodePosition3.x - bottomLineNodePosition2.x) * scalePixelsPerCm;
    const maxWidthCell4 = (bottomLineNodePosition4.x - bottomLineNodePosition3.x) * scalePixelsPerCm;

    // margin in pixels
    const margin = 8;
    const xOffsetMargin = margin / scalePixelsPerCm;

    // cell height in cytoscape coordinate unit
    const cellHeight = 2;

    surveyInfoNodes.push(
      // -----------cell1-----------
      createNewNode(
        bottomLineNodesAscByX[0]!,
        "survey_info_ta_locality",
        xOffsetMargin,
        (cellHeight * 4) / 5,
        TA_LOCALITY,
        {
          "text-max-width": maxWidthCell1 - 2 * xOffsetMargin,
          "font-size": "12px",
          "text-halign": "right",
        },
      ),
    );
    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[0]!,
        "survey_info_ta_cell_title",
        xOffsetMargin,
        (cellHeight * 2) / 5,
        TA_CELL_TITLE,
        {
          "text-max-width": maxWidthCell1 - 2 * xOffsetMargin,
          "font-size": "15px",
          "text-halign": "right",
        },
      ),
    );
    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[0]!,
        "survey_info_ta_generated_datetime",
        xOffsetMargin,
        cellHeight / 5,
        GENERATED_DATE_TIME,
        {
          "text-max-width": maxWidthCell1 - 2 * xOffsetMargin,
          "font-size": "10px",
          "text-halign": "right",
        },
      ),
    );
    // -----------cell2-----------
    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[1]!,
        "survey_info_survey_reference",
        (bottomLineNodePosition1.x + bottomLineNodePosition2.x) / 2 - bottomLineNodePosition1.x,
        1,
        memoize(wrapText)(
          SURVEY_REFERENCE,
          maxWidthCell2,
          cellHeight * scalePixelsPerCm - 2 * xOffsetMargin,
          1.2,
          15,
          "Arial",
        ),
        {
          "text-max-width": maxWidthCell2,
          "font-size": "15px",
          "text-wrap": "wrap",
          "line-height": 1.2,
        },
      ),
    );
    // -----------cell3-----------
    isSurveySheet &&
      surveyInfoNodes.push(
        createNewNode(
          bottomLineNodesAscByX[2]!,
          "survey_info_survey_date",
          xOffsetMargin,
          cellHeight / 6,
          SURVEY_DATE,
          {
            "text-max-width": maxWidthCell3 - 2 * xOffsetMargin,
            "font-size": "12px",
            "text-halign": "right",
          },
        ),
      );

    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[2]!,
        "survey_info_surveyor_name",
        xOffsetMargin,
        isSurveySheet ? (cellHeight * 5) / 6 : (cellHeight * 2) / 3,
        SURVEYOR_NAME,
        {
          "text-max-width": maxWidthCell3 - 2 * xOffsetMargin,
          "font-size": isSurveySheet ? "13px" : "15px",
          "text-halign": "right",
        },
      ),
    );
    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[2]!,
        "survey_info_firm_name",
        xOffsetMargin,
        isSurveySheet ? (cellHeight * 3) / 6 : cellHeight / 3,
        FIRM_NAME,
        {
          "text-max-width": maxWidthCell3 - 2 * xOffsetMargin,
          "font-size": isSurveySheet ? "13px" : "15px",
          "text-halign": "right",
        },
      ),
    );

    // -----------cell4-----------
    surveyInfoNodes.push(
      createNewNode(
        bottomLineNodesAscByX[3]!,
        "survey_info_csd_number_title",
        xOffsetMargin,
        (cellHeight * 2) / 3,
        CSD_NUMBER_TITLE,
        {
          "text-max-width": maxWidthCell4 - 2 * xOffsetMargin,
          "font-size": "15px",
          "text-halign": "right",
        },
      ),
    );

    surveyInfoNodes.push(
      createNewNode(bottomLineNodesAscByX[3]!, "survey_info_csd_number", xOffsetMargin, cellHeight / 3, CSD_NUMBER, {
        "text-max-width": maxWidthCell4 - 2 * xOffsetMargin,
        "font-size": "15px",
        "text-halign": "right",
      }),
    );

    return surveyInfoNodes;
  };

  return {
    startProcessing,
    ExportingCanvas,
    processing,
    stopProcessing,
  };
};
