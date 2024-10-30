import { accessToken } from "@linz/lol-auth-js";
import { FileUploaderClient } from "@linz/secure-file-upload";
import { DisplayStateEnum, LabelDTOLabelTypeEnum, PlanCompileRequest } from "@linz/survey-plan-generation-api-client";
import { PlanGraphicsCompileRequest } from "@linz/survey-plan-generation-api-client/dist/models/PlanGraphicsCompileRequest";
import { FileUploadDetails } from "@linz/survey-plan-generation-api-client/src/models/FileUploadDetails";
import { useToast } from "@linzjs/lui";
import { PromiseWithResolve, useLuiModalPrefab } from "@linzjs/windows";
import cytoscape from "cytoscape";
import React, { useEffect, useRef, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  edgeDefinitionsFromData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import makeCytoscapeStylesheet from "@/components/CytoscapeCanvas/makeCytoscapeStylesheet";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { warning126024_planGenHasRunBefore } from "@/components/PlanSheets/prefabWarnings";
import { useAppSelector } from "@/hooks/reduxHooks";
import {
  cyImageExportConfig,
  ImageFile,
  PlanSheetTypeAbbreviation,
  PlanSheetTypeObject,
} from "@/hooks/usePlanGenPreview";
import { useTransactionId } from "@/hooks/useTransactionId";
import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageEdges,
  extractPageNodes,
} from "@/modules/plan/extractGraphData";
import { useCompilePlanMutation, usePreCompilePlanCheck } from "@/queries/plan";
import { getDiagrams, getPages } from "@/redux/planSheets/planSheetsSlice";
import { compressImage, generateBlankJpegBlob } from "@/util/imageUtil";

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
  const { showPrefabModal } = useLuiModalPrefab();
  const {
    mutateAsync: compilePlan,
    isSuccess: compilePlanIsSuccess,
    error: compilePlanError,
  } = useCompilePlanMutation({ transactionId });

  const {
    mutateAsync: preCompilePlanCheck,
    isSuccess: preCompilePlanIsSuccess,
    isPending: preCompilePlanIsPending,
    error: preCompilePlanError,
  } = usePreCompilePlanCheck({ transactionId });

  const preCheckResult = () => !preCompilePlanIsPending && preCompilePlanCheck();

  const secureFileUploadClient = useRef<FileUploaderClient>(
    new FileUploaderClient({
      maxFileSizeHint: 1024 * 1024 * 100,
      allowableFileExtHint: [".jpg", ".jpeg"],
      skipStatusPolling: true,
      errorNotifier: (error) => {
        console.log(error);
      },
      baseUrl: window._env_.secureFileUploadBaseUrl,
    }),
  ).current;

  useEffect(() => {
    if (preCompilePlanIsSuccess) {
      console.log("Pre-compile plan check is successful.");
    }
  }, [preCompilePlanIsSuccess]);

  useEffect(() => {
    if (compilePlanIsSuccess) {
      console.log("Compile plan process has successfully completed.");
    }
  }, [compilePlanIsSuccess]);

  useEffect(() => {
    if (!preCompilePlanError) {
      return;
    }
    const serializedPreCompileError = errorFromSerializedError(preCompilePlanError);
    newrelic.noticeError(serializedPreCompileError);
    void showPrefabModal(unhandledErrorModal(serializedPreCompileError));
  }, [preCompilePlanError, showPrefabModal, transactionId]);

  useEffect(() => {
    if (!compilePlanError) {
      return;
    }
    const serializedCompilePlanError = errorFromSerializedError(compilePlanError);
    newrelic.noticeError(serializedCompilePlanError);
    void showPrefabModal(unhandledErrorModal(serializedCompilePlanError));
  }, [compilePlanError, showPrefabModal, transactionId]);

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
    setCompiling(true);
    const preCheckPassed = await preCheckResult();
    if (preCheckPassed) {
      if (preCheckPassed.hasPlanGenRanBefore) {
        if (await showPrefabModal(warning126024_planGenHasRunBefore)) {
          await continueCompile();
        }
      } else {
        await continueCompile();
      }
    } else {
      console.log("Pre-compile plan check failed.");
      setCompiling(false);
      return;
    }
    setCompiling(false);
  };

  const continueCompile = async () => {
    console.log("Compile plan process has started.");
    if (!cyRef.current || !cyMapper.current) {
      console.error("cytoscape instance is not available");
      return;
    }
    const cyRefCurrent = cyRef.current;
    const cyMapperCurrent = cyMapper.current;
    try {
      const processFilesGroup = Object.values(PlanSheetTypeObject).map((obj): ImageFile[] => {
        const imageFiles: ImageFile[] = [];
        const activePlanSheetPages = pages.filter((p) => p.pageType === obj.type);
        const maxPageNumber = Math.max(...activePlanSheetPages.map((p) => p.pageNumber));

        let firstTimeExport = true;
        for (let currentPageNumber = 1; currentPageNumber <= maxPageNumber; currentPageNumber++) {
          const imageName = `${obj.typeAbbr}-${currentPageNumber}.jpg`;
          const currentPage = activePlanSheetPages.find((p) => p.pageNumber === currentPageNumber);
          const currentPageId = currentPage?.id;
          const currentPageNodes = currentPage ? extractPageNodes([currentPage]) : [];

          if (!currentPageId) {
            continue;
          }

          const currentPageDiagrams = diagrams.filter((d) => d.pageRef === currentPageId);

          // filter out hidden nodes
          let diagramNodeData = extractDiagramNodes(currentPageDiagrams).filter(
            (node) =>
              ![DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(
                node.properties.displayState?.valueOf() ?? "",
              ),
          );

          // filter out the mark name if the sheet type is title plan title
          if (obj.typeAbbr === PlanSheetTypeAbbreviation.TITLE_PLAN_TITLE) {
            diagramNodeData = diagramNodeData.filter(
              (node) => node.properties.labelType !== LabelDTOLabelTypeEnum.markName,
            );
          }

          const diagramEdgeData = extractDiagramEdges(currentPageDiagrams);
          const currentPageEdges = extractPageEdges([currentPage]);

          const nodeData = [...diagramNodeData, ...currentPageNodes];
          const edgeData = [...diagramEdgeData, ...currentPageEdges];

          if (nodeData.length === 0 && edgeData.length === 0) {
            // generate a blank 100x100 white image for empty page
            void generateBlankJpegBlob(100, 100).then((blob) => {
              imageFiles.push({ name: imageName, blob: blob });
            });

            continue;
          }

          cyRefCurrent.add({
            nodes: nodeDefinitionsFromData(nodeData, cyMapperCurrent),
            edges: edgeDefinitionsFromData(edgeData),
          });

          cyRefCurrent
            .layout({
              name: "preset",
              fit: false,
              positions: nodePositionsFromData(nodeData, cyMapperCurrent),
            })
            .run();

          const jpg = cyRefCurrent?.jpg({
            ...cyImageExportConfig,
            maxWidth: 9202,
            maxHeight: 5824,
            quality: 1,
          });

          // This is a workaround to fix the issue sometimes the first exported image doesn't have bg images rendered in cytoscape
          // so here we just rerun the export for each pages
          if (firstTimeExport) {
            currentPageNumber--;
            firstTimeExport = false;
            continue;
          }
          imageFiles.push({ name: imageName, blob: jpg });
          firstTimeExport = true;
          cyRefCurrent.remove(cyRefCurrent.elements());
          cyRefCurrent?.removeAllListeners();
        }
        return imageFiles;
      });
      const imageFiles = processFilesGroup.flat();
      await generateCompilation(imageFiles);
    } catch (e) {
      errorToast("An error occurred while compile the layout.");
      console.error(e);
    } finally {
      cyRef.current?.off("add");
      setCompiling(false);
    }
  };

  const generateCompilation = async (imageFiles: ImageFile[]) => {
    try {
      const processUploadJobs = imageFiles.map(async (imageFile) => {
        try {
          const image = await compressImage(imageFile);
          return await secureFileUploadClient.uploadFile(image.compressedImage);
        } catch (e) {
          return Promise.reject(e);
        }
      });

      const sfuCombinedResponse = await Promise.all(processUploadJobs);

      const sfuResponse = sfuCombinedResponse.map((response) => ({
        fileUlid: response.fileUlid,
      })) as unknown as FileUploadDetails[];

      const planGraphicsCompileRequest: PlanGraphicsCompileRequest = {
        filesUlids: sfuResponse,
      };

      const token = await accessToken();

      if (token) {
        const planCompilationRequest: PlanCompileRequest = {
          transactionId: transactionId,
          authorization: `Bearer ${token}`,
          planGraphicsCompileRequest: planGraphicsCompileRequest,
        };

        await compilePlan(planCompilationRequest);
      } else {
        console.error("Failed to get access token");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    startCompile,
    CompilationExportCanvas,
    compiling,
  };
};
