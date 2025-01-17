import { PostDiagramsRequestDTODiagramTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useContext } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { error32021_diagramNoArea, error32027_diagramTooManySides } from "@/components/DefineDiagrams/prefabErrors";
import ScaleDiagram from "@/components/DefineDiagrams/ScaleDiagram";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { DrawInteractionType, useOpenLayersDrawInteraction } from "@/hooks/useOpenLayersDrawInteraction";
import { useTransactionId } from "@/hooks/useTransactionId";
import { useGetDiagramsQuery } from "@/queries/diagrams";
import { InsertDiagramError, useInsertDiagramMutation } from "@/queries/useInsertDiagramMutation";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { useShowToast } from "@/util/showToast";

const actionToDiagramTypeAndShape: Partial<
  Record<DefineDiagramsActionType, [PostDiagramsRequestDTODiagramTypeEnum, DrawInteractionType]>
> = {
  define_primary_diagram_rectangle: [PostDiagramsRequestDTODiagramTypeEnum.UDFP, "Rectangle"],
  define_primary_diagram_polygon: [PostDiagramsRequestDTODiagramTypeEnum.UDFP, "Polygon"],
  define_nonprimary_diagram_rectangle: [PostDiagramsRequestDTODiagramTypeEnum.UDFN, "Rectangle"],
  define_nonprimary_diagram_polygon: [PostDiagramsRequestDTODiagramTypeEnum.UDFN, "Polygon"],
  define_survey_diagram_rectangle: [PostDiagramsRequestDTODiagramTypeEnum.UDFT, "Rectangle"],
  define_survey_diagram_polygon: [PostDiagramsRequestDTODiagramTypeEnum.UDFT, "Polygon"],
};

const maxSides = 47;

export const useInsertDiagram = () => {
  const transactionId = useTransactionId();

  const { map } = useContext(LolOpenLayersMapContext);
  const { showPrefabModal } = useLuiModalPrefab();

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);
  const {
    data: diagrams,
    isLoading: diagramsAreLoading,
    error: diagramsLoadError,
  } = useGetDiagramsQuery({
    transactionId,
  });

  const { mutateAsync: insertDiagram, isPending: loading } = useInsertDiagramMutation(transactionId);
  const { showErrorToast } = useShowToast();

  const enabled = activeAction in actionToDiagramTypeAndShape;
  const [diagramType, type] = actionToDiagramTypeAndShape[activeAction] ?? [];

  const setAction = (action: DefineDiagramsActionType) => dispatch(setActiveAction(action));

  const drawAbort = () => setAction("idle");

  useOpenLayersDrawInteraction({
    enabled,
    options: { type },
    maxPoints: {
      count: maxSides + 1,
      errorCallback: () => void showPrefabModal(error32027_diagramTooManySides(maxSides)),
    },
    drawEnd: async ({ area, latLongCartesians }) => {
      if (!map || !diagramType || diagramsAreLoading || diagramsLoadError) return;

      if (area === 0) {
        void showPrefabModal(error32021_diagramNoArea);
        return;
      }

      const scaleDiagram = diagrams && new ScaleDiagram(diagrams);
      const zoomScale = scaleDiagram?.zoomScale(latLongCartesians) ?? 1;

      try {
        await insertDiagram({
          transactionId,
          postDiagramsRequestDTO: { diagramType, zoomScale, coordinates: latLongCartesians },
        });
      } catch (ex) {
        showErrorToast((ex instanceof InsertDiagramError && ex.message) || "Unexpected error");
      } finally {
        drawAbort();
      }
    },
    drawAbort,
  });

  if (diagramsLoadError) {
    console.warn(`Could not load diagrams for useInsertDiagram ${diagramsLoadError.message}`);
    // We don't want to throw here as it interferes with correct 404 handling
  }

  return {
    loading,
  };
};
