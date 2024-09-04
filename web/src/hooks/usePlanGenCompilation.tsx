import { FileUploaderClient } from "@linz/secure-file-upload";
import { DisplayStateEnum, PlanCompileRequest } from "@linz/survey-plan-generation-api-client";
import { PlanGraphicsCompileRequest } from "@linz/survey-plan-generation-api-client/dist/models/PlanGraphicsCompileRequest";
import { useToast } from "@linzjs/lui";
import { PromiseWithResolve } from "@linzjs/windows";
import cytoscape from "cytoscape";
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
    allowableFileExtHint: [".png"],
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
      cyRef.current = cytoscape({
        container: canvasRef.current,
        layout: { name: "grid", boundingBox: { x1: 0, y1: 0, x2: 0, y2: 0 } },
      });
      cyMapper.current = new CytoscapeCoordinateMapper(
        canvasRef.current,
        // eslint-disable-next-line react/prop-types
        diagrams,
        window.screen.width, // get user's screen max width and height
        window.screen.height,
        -50,
      );
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
        // listen add action to wait for the node bg images, style & layout to be applied
        let nodeBgPromise, stylePromise, layoutPromise;
        cyRefCurrent?.one("add", () => {
          nodeBgPromise = cyRefCurrent?.nodes().promiseOn("background");
          stylePromise = cyRefCurrent?.promiseOn("style");
          layoutPromise = cyRefCurrent?.promiseOn("layoutstop");
        });

        const imageFiles: ImageFile[] = [];
        for (let currentPageNumber = 1; currentPageNumber <= maxPageNumber; currentPageNumber++) {
          const imageName = `${obj.typeAbbr}-${currentPageNumber}.jpg`;
          const currentPageId = activePlanSheetPages.find((p) => p.pageNumber == currentPageNumber)?.id;

          if (!currentPageId) {
            continue;
          }

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

          cyRefCurrent?.style(makeCytoscapeStylesheet(cyMapperCurrent, true)).update();

          cyRefCurrent
            .layout({
              name: "preset",
              fit: false,
              positions: nodePositionsFromData(diagramNodeData, cyMapperCurrent),
            })
            .run();

          // wait 10s for style, layout and node bg images applied
          await Promise.all(
            [stylePromise, layoutPromise, nodeBgPromise].map(
              (p) => p && promiseWithTimeout(p, 10000, "wait for cytoscape rendering timed out"),
            ),
          );

          const png = cyRefCurrent?.png(cyImageExportConfig);
          imageFiles.push({ name: imageName, blob: png });

          // remove all elements for the next page rendering
          cyRefCurrent.remove(cyRefCurrent.elements());
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
