import { PostDiagramsRequestDTODiagramTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useContext, useState } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { error32027_diagramTooManySides } from "@/components/DefineDiagrams/prefabErrors.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { DrawInteractionType, useOpenLayersDrawInteraction } from "@/hooks/useOpenLayersDrawInteraction.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { useInsertDiagramMutation } from "@/queries/useInsertDiagramMutation.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

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
  const [loading, setLoading] = useState(false);

  const { map } = useContext(LolOpenLayersMapContext);
  const { showPrefabModal } = useLuiModalPrefab();

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const { mutateAsync: insertDiagram } = useInsertDiagramMutation(transactionId);

  const enabled = activeAction in actionToDiagramTypeAndShape;
  const [diagramType, type] = actionToDiagramTypeAndShape[activeAction] ?? [];

  const setAction = (action: DefineDiagramsActionType) => dispatch(setActiveAction(action));
  const drawAbort = () => setAction("idle");

  useOpenLayersDrawInteraction({
    enabled,
    options: { type },
    maxPoints: {
      count: maxSides + 1,
      errorCallback: () => showPrefabModal(error32027_diagramTooManySides(maxSides)),
    },
    drawEnd: async ({ cartesianCoordinates }) => {
      if (!map || !diagramType) return;
      const zoom = map.getView().getZoom() ?? 200;

      try {
        setLoading(true);
        await insertDiagram({
          transactionId,
          postDiagramsRequestDTO: { diagramType, zoomScale: zoom, coordinates: cartesianCoordinates },
        });
      } finally {
        setLoading(false);
        drawAbort();
      }
    },
    drawAbort,
  });

  return {
    loading,
  };
};
