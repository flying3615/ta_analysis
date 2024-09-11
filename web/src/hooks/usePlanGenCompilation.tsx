import { FileUploaderClient } from "@linz/secure-file-upload";
import { DisplayStateEnum, PlanCompileRequest } from "@linz/survey-plan-generation-api-client";
import { PlanGraphicsCompileRequest } from "@linz/survey-plan-generation-api-client/dist/models/PlanGraphicsCompileRequest";
import { useToast } from "@linzjs/lui";
import { PromiseWithResolve } from "@linzjs/windows";
import cytoscape, { EventHandler } from "cytoscape";
import React, { useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import {
  cyImageExportConfig,
  ImageFile,
  PlanSheetTypeAbbreviation,
  PlanSheetTypeObject,
} from "@/hooks/usePlanGenPreview.tsx";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData.ts";
import { getDiagrams, getPages } from "@/redux/planSheets/planSheetsSlice.ts";
import { convertImageDataTo1Bit, generateBlankImageBlob } from "@/util/imageUtil.ts";
import { promiseWithTimeout } from "@/util/promiseUtil.ts";

export interface PlanGenCompilation {
  startCompile: () => Promise<void>;
  CompilationExportCanvas: React.FC;
  compiling: boolean;
}

export const usePlanGenCompilation = (): PlanGenCompilation => {
  const { error: errorToast } = useToast();
  const pages = useAppSelector(getPages);
  const diagrams = useAppSelector(getDiagrams);

  const canvasRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core>();
  const cyMapper = useRef<CytoscapeCoordinateMapper>();

  const [compiling, setCompiling] = useState<boolean>(false);
  const processingModal = useRef<PromiseWithResolve<boolean>>();
  const transactionId = useTransactionId();

  const secureFileUploadClient = new FileUploaderClient({
    maxFileSizeHint: 1024 * 1024 * 100,
    allowableFileExtHint: [".jpg"],
    errorNotifier: (error) => {
      console.log(error);
    },
    baseUrl: window._env_.secureFileUploadBaseUrl,
  });

  useEffect(() => {
    if (!compiling) {
      processingModal.current?.resolve?.(false);
    }
  }, [compiling]);

  const CompilationExportCanvas = () => {
    useEffect(() => {
      if (!canvasRef.current) {
        throw Error("CytoscapeCanvas::initCytoscape - not ready");
      }
      cyMapper.current = new CytoscapeCoordinateMapper(
        canvasRef.current,
        // eslint-disable-next-line react/prop-types
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
      <div style={{ width: "1px", height: "1px", background: "transparent" }}>
        <div data-testid="cy-exporting-canvas" ref={canvasRef}></div>
      </div>
    );
  };

  const startCompile = async () => {
    if (!cyRef.current || !cyMapper.current) {
      console.error("cytoscape instance is not available");
      return;
    }
    const cyRefCurrent = cyRef.current;
    const cyMapperCurrent = cyMapper.current;

    try {
      setCompiling(true);
      Object.values(PlanSheetTypeObject).map(async (obj) => {
        const activePlanSheetPages = pages.filter((p) => p.pageType == obj.type);
        const maxPageNumber = Math.max(...activePlanSheetPages.map((p) => p.pageNumber));

        const imageFiles: ImageFile[] = [];
        let firstTimeExport = true;

        for (let currentPageNumber = 1; currentPageNumber <= maxPageNumber; currentPageNumber++) {
          const imageName = `${obj.typeAbbr}-${currentPageNumber}.jpg`;
          const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == currentPageNumber)?.id;

          if (!currentPageId) {
            continue;
          }

          let nodeBgPromise: Promise<EventHandler | void>[] = [];
          let layoutPromise: Promise<EventHandler | void> = Promise.resolve();
          cyRefCurrent?.one("add", async () => {
            layoutPromise = cyRefCurrent?.promiseOn("layoutstop").then(() => {
              nodeBgPromise = cyRefCurrent?.nodes().map((n, _) => {
                // :nonbackgrounding : Matches an element if its background image not currently loading;
                // i.e. there is no image or the image is already loaded.
                return n.is(":nonbackgrounding") ? Promise.resolve() : n.promiseOn("background");
              });
            });
          });

          const currentPageDiagrams = diagrams.filter((d) => d.pageRef == currentPageId);

          // filter out hidden nodes
          let diagramNodeData = extractDiagramNodes(currentPageDiagrams).filter(
            (node) =>
              ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
                node.properties["displayState"]?.toString() ?? "",
              ),
          );

          // filter out the mark name if the sheet type is title plan title
          if (obj.typeAbbr === PlanSheetTypeAbbreviation.TITLE_PLAN_TITLE.valueOf()) {
            diagramNodeData = diagramNodeData.filter(
              (node) => !node.properties["labelType"] || node.properties["labelType"] != "markName",
            );
          }

          const diagramEdgeData = extractDiagramEdges(currentPageDiagrams);

          if (diagramNodeData.length === 0 && diagramEdgeData.length === 0) {
            // generate a blank 100x100 white image for empty page
            const blob = await generateBlankImageBlob(100, 100);
            imageFiles.push({ name: imageName, blob: blob });
            continue;
          }

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

          // wait 30s for layout and node bg images to be applied
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

          const jpg = cyRefCurrent?.jpg({ ...cyImageExportConfig, quality: 1 });

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
        await generateCompilation(imageFiles);
      });
    } catch (e) {
      errorToast("An error occurred while compile the layout.");
      console.error(e);
      setCompiling(false);
    } finally {
      cyRef.current?.off("add");
    }
  };

  const generateCompilation = async (imageFiles: ImageFile[]) => {
    try {
      const processUploadJobs = imageFiles.map(async (f) => {
        const file = await convertImageDataTo1Bit(f);
        return await secureFileUploadClient.uploadFile(file.processedBlob);
      });

      const sfuCombinedResponse = await Promise.all(processUploadJobs);

      const planCompilationRequest: PlanCompileRequest = {
        transactionId: transactionId,
        planGraphicsCompileRequest: sfuCombinedResponse as unknown as PlanGraphicsCompileRequest,
      };

      console.log("---Plan Graphic Request to our BE", planCompilationRequest);

      // TODO wait for BE api to be ready and the below API returns 501 not implemented at this time
      // const planGraphicResponsePdf = await new PlanGraphicsControllerApi(apiConfig()).planCompile(
      //   planCompilationRequest,
      // );
      // console.log("the compile response is ", planGraphicResponsePdf.statusMessage);
    } catch (e) {
      console.error(e);
    } finally {
      setCompiling(false);
    }
  };

  return {
    startCompile,
    CompilationExportCanvas,
    compiling,
  };
};
