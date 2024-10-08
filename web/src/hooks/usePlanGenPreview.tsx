import { DisplayStateEnum, PageDTOPageTypeEnum } from "@linz/survey-plan-generation-api-client";
import { useToast } from "@linzjs/lui";
import { PromiseWithResolve, useLuiModalPrefab } from "@linzjs/windows";
import cytoscape, { EventHandler, ExportBlobOptions } from "cytoscape";
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
import { isPlaywrightTest } from "@/test-utils/cytoscape-data-utils.ts";
import { createNewNode } from "@/util/mapUtil.ts";
import { promiseWithTimeout } from "@/util/promiseUtil.ts";
import { wrapText } from "@/util/stringUtil.ts";
import PreviewWorker from "@/workers/previewWorker?worker";
export interface PlanGenPreview {
  startPreview: () => Promise<void>;
  PreviewExportCanvas: React.FC;
  previewing: boolean;
  stopPreviewing: () => void;
}

export interface ImageFile {
  name: string;
  blob: Blob;
}

export const cyImageExportConfig = {
  full: true,
  output: "blob",
  bg: "#fff",
  maxWidth: 9921,
  maxHeight: 7016,
} as ExportBlobOptions;

export enum PlanSheetTypeAbbreviation {
  TITLE_PLAN_TITLE = "DTPS",
  SURVEY_PLAN_TITLE = "DSPT",
  SURVEY_PLAN_SURVEY = "DSPS",
}

export const PlanSheetTypeObject = [
  { typeAbbr: PlanSheetTypeAbbreviation.TITLE_PLAN_TITLE, type: PageDTOPageTypeEnum.survey },
  { typeAbbr: PlanSheetTypeAbbreviation.SURVEY_PLAN_TITLE, type: PageDTOPageTypeEnum.title },
  { typeAbbr: PlanSheetTypeAbbreviation.SURVEY_PLAN_SURVEY, type: PageDTOPageTypeEnum.survey },
];

export const usePlanGenPreview = (props: {
  transactionId: number;
  surveyInfo: ExternalSurveyInfoDto;
  pageConfigsEdgeData?: IEdgeData[];
  pageConfigsNodeData?: INodeData[];
}): PlanGenPreview => {
  const { error: errorToast } = useToast();
  const activeSheet = useAppSelector(getActiveSheet);
  const pages = useAppSelector(getPages);
  const diagrams = useAppSelector(getDiagrams);
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
  const cyMapper = useRef<CytoscapeCoordinateMapper>();

  const [previewing, setPreviewing] = useState<boolean>(false);
  let worker = new PreviewWorker();
  const processingModal = useRef<PromiseWithResolve<boolean>>();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    if (!previewing) {
      processingModal.current?.resolve?.(false);
    }
  }, [previewing]);

  const PreviewExportCanvas = () => {
    useEffect(() => {
      if (!canvasRef.current) {
        throw Error("CytoscapeCanvas::initCytoscape - not ready");
      }
      cyMapper.current = new CytoscapeCoordinateMapper(
        canvasRef.current,
        diagrams,
        window.screen.width, // get user's screen max width and height
        window.screen.height,
        -50,
      );
      cyRef.current = cytoscape({
        container: canvasRef.current,
        layout: { name: "grid", boundingBox: { x1: 0, y1: 0, x2: 0, y2: 0 } },
        style: makeCytoscapeStylesheet(cyMapper.current, true),
      });
    }, []);

    return (
      <div ref={modalOwnerRef} style={{ width: "1px", height: "1px", background: "transparent" }}>
        <div data-testid="cy-exporting-canvas" ref={canvasRef}></div>
      </div>
    );
  };

  const startPreview = async () => {
    if (!cyRef.current || !cyMapper.current) {
      console.error("cytoscape instance is not available");
      return;
    }

    const cyRefCurrent = cyRef.current;
    const cyMapperCurrent = cyMapper.current;

    // Don't block the exporting process
    void showProcessingModal();

    setPreviewing(true);

    // find the max pageNumber for the given activeSheet type like survey or title
    const activePlanSheetPages = pages.filter((p) => p.pageType == activeSheet);
    const maxPageNumber = Math.max(...activePlanSheetPages.map((p) => p.pageNumber));
    const isSurveySheet = activeSheet === PlanSheetType.SURVEY;
    const sheetName = isSurveySheet
      ? PlanSheetTypeAbbreviation.SURVEY_PLAN_SURVEY
      : PlanSheetTypeAbbreviation.SURVEY_PLAN_TITLE;

    try {
      const imageFiles: ImageFile[] = [];
      let firstTimeExport = true;
      for (let currentPageNumber = 1; currentPageNumber <= maxPageNumber; currentPageNumber++) {
        const imageName = `${sheetName}-${currentPageNumber}.jpg`;
        const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == currentPageNumber)?.id;

        if (!currentPageId) {
          continue;
        }

        let nodeBgPromise: Promise<EventHandler | void>[] = [];
        let layoutPromise: Promise<EventHandler | void> = Promise.resolve();
        cyRefCurrent?.one("add", () => {
          layoutPromise = cyRefCurrent?.promiseOn("layoutstop").then(() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            nodeBgPromise = cyRefCurrent?.nodes().map((n, _) => {
              // :nonbackgrounding : Matches an element if its background image not currently loading;
              // i.e. there is no image or the image is already loaded.
              return n.is(":nonbackgrounding") ? Promise.resolve() : n.promiseOn("background");
            });
          });
        });

        const currentPageDiagrams = diagrams.filter((d) => d.pageRef == currentPageId);
        const surveyInfoNodes = await extractSurveyInfoNodeData(
          props.surveyInfo,
          cyMapperCurrent.scalePixelsPerCm,
          isSurveySheet,
          currentPageNumber,
          maxPageNumber,
        );

        const diagramNodeData = [
          ...surveyInfoNodes, // survey info text nodes
          ...(props.pageConfigsNodeData ?? []), // page frame and north compass nodes
          ...extractDiagramNodes(currentPageDiagrams).filter(
            (node) =>
              ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
                node.properties["displayState"]?.toString() ?? "",
              ),
          ), // filter out hidden diagram nodes
        ];

        const sheetType = activeSheet === PlanSheetType.TITLE ? "T" : "S";
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
          nodes: nodeDefinitionsFromData(diagramNodeData, cyMapperCurrent),
          edges: edgeDefinitionsFromData(diagramEdgeData),
        });

        cyRefCurrent
          .layout({
            name: "preset",
            fit: false,
            positions: nodePositionsFromData(diagramNodeData, cyMapperCurrent),
          })
          .run();

        await layoutPromise;

        // wait 30s for node bg images to be applied
        await Promise.all(
          [layoutPromise, ...nodeBgPromise].map((p, index) =>
            promiseWithTimeout(
              {
                promise: p,
                name: `page ${currentPageNumber} ${index} node background images promise`,
              },
              30000,
              "timed out",
            ),
          ),
        );

        const jpg = cyRefCurrent?.jpg({ ...cyImageExportConfig, quality: 0 });

        // This is a workaround to fix the issue sometimes the first exported image doesn't have bg images rendered in cytoscape
        // so here we just rerun the export for each pages
        if (firstTimeExport) {
          currentPageNumber--;
          firstTimeExport = false;
          continue;
        }

        imageFiles.push({ name: imageName, blob: jpg });
        firstTimeExport = true;

        // remove all elements for the next page rendering
        cyRefCurrent.remove(cyRefCurrent.elements());
        cyRefCurrent?.removeAllListeners();
      }
      if (isPlaywrightTest()) {
      /* eslint-disable */
      // to download jpeg images in tests
      (window as any).imageFiles = imageFiles;
      }
      await generatePreviewPDF(imageFiles);
    } catch (e) {
      errorToast("An error occurred while previewing the layout.");
      console.error(e);
      setPreviewing(false);
    } finally {
      cyRefCurrent?.off("add");
    }
  };

  const stopPreviewing = () => {
    // terminate the current worker and create a new one for next execution
    worker.terminate();
    worker = new PreviewWorker();
    setPreviewing(false);
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
      stopPreviewing();
    }
  };

  const generatePreviewPDF = async (imageFiles: ImageFile[]) => {
    worker.postMessage({ type: "PREVIEW", ImageFiles: imageFiles });
    worker.onmessage = async (e) => {
      setPreviewing(false);
      const { payload } = e.data;
      window.open(payload, "_blank");
      if (isPlaywrightTest()) {
        /* eslint-disable */
        // to download pdf in tests
        (window as any).pdfBlobUrl = payload;
      }
    };
    worker.onerror = (e) => {
      console.error(e);
      setPreviewing(false);
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

    // Find the minimum y position
    const minY = Math.min(...props.pageConfigsNodeData.map((node) => node.position.y));
    const bottomLineNodesAscByX = props.pageConfigsNodeData
      ?.filter((node) => node.position.y === minY)
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
          "font-size": "18px",
          "text-halign": "right",
        },
      ),
    );

    surveyInfoNodes.push(
      createNewNode(bottomLineNodesAscByX[3]!, "survey_info_csd_number", xOffsetMargin, cellHeight / 3, CSD_NUMBER, {
        "text-max-width": maxWidthCell4 - 2 * xOffsetMargin,
        "font-size": "18px",
        "text-halign": "right",
      }),
    );

    return surveyInfoNodes;
  };

  return {
    startPreview,
    PreviewExportCanvas,
    previewing,
    stopPreviewing,
  };
};
