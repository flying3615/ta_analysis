import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import { PostDiagramsRequestDTODiagramTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { IFeatureSourceDiagram } from "@/components/DefineDiagrams/featureMapper.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { useOpenLayersDrawInteraction } from "@/hooks/useOpenLayersDrawInteraction.ts";
import { usePrevious } from "@/hooks/usePrevious.ts";
import { useTransactionId } from "@/hooks/useTransactionId.ts";
import { getDiagramsQueryKey, useInsertDiagramMutation } from "@/queries/diagrams.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

const actionToDiagramType: Partial<Record<DefineDiagramsActionType, PostDiagramsRequestDTODiagramTypeEnum>> = {
  define_primary_diagram_rectangle: PostDiagramsRequestDTODiagramTypeEnum.UDFP,
  define_primary_diagram_polygon: PostDiagramsRequestDTODiagramTypeEnum.UDFP,
  define_non_primary_diagram_rectangle: PostDiagramsRequestDTODiagramTypeEnum.UDFN,
  define_non_primary_diagram_polygon: PostDiagramsRequestDTODiagramTypeEnum.UDFN,
  define_survey_diagram_rectangle: PostDiagramsRequestDTODiagramTypeEnum.UDFT,
  define_survey_diagram_polygon: PostDiagramsRequestDTODiagramTypeEnum.UDFT,
};

const maxSides = 47;

export const DefineDiagram = () => {
  const queryClient = useQueryClient();

  const transactionId = useTransactionId();
  const { showPrefabModal } = useLuiModalPrefab();
  const { map } = useContext(LolOpenLayersMapContext);
  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const { mutate: insertDiagram } = useInsertDiagramMutation(transactionId);

  const type = //
    activeAction.includes("rectangle")
      ? "Rectangle" //
      : activeAction.includes("polygon")
        ? "Polygon"
        : undefined;

  const enabled = !!type;

  const prevEnabled = usePrevious(enabled);
  const prevAction = usePrevious(activeAction);
  useEffect(() => {
    if (
      enabled &&
      prevAction !== activeAction &&
      activeAction !== "idle" &&
      !["define_primary_diagram_rectangle", "define_primary_diagram_polygon"].includes(activeAction)
    ) {
      const diagrams = queryClient.getQueryData<IFeatureSourceDiagram[]>(getDiagramsQueryKey(transactionId));
      if (!diagrams || !diagrams.some((f) => CpgDiagramType.UDFP.valueOf() === f.diagramType)) {
        showPrefabModal({
          level: "error",
          title: "Message: 32026",
          children:
            "Non Primary user defined diagrams cannot be created, as\n" +
            "there is no boundary information included in this survey.",
        }).then(() => {
          dispatch(setActiveAction("idle"));
        });
      }
    }
  }, [activeAction, dispatch, enabled, prevAction, prevEnabled, queryClient, showPrefabModal, transactionId]);

  useOpenLayersDrawInteraction({
    options: { type },
    maxPoints: {
      count: maxSides + 1,
      errorCallback: () =>
        showPrefabModal({
          level: "error",
          title: "Message: 32027",
          children:
            "The diagram cannot be created, as it has too many sides.\n" +
            `Define an area of interest with no more than ${maxSides} sides.`,
        }),
    },
    drawAbort: () => {
      dispatch(setActiveAction("idle"));
    },
    drawEnd: async ({ cartesianCoordinates }) => {
      if (!map) return;
      const zoom = map.getView().getZoom();
      if (zoom == null) {
        console.error("map zoom should not be undefined, cancelling action");
        return;
      }

      const diagramType = actionToDiagramType[activeAction];
      if (!diagramType) {
        // There should be no way for this to happen, hence a throw
        throw Error(`No matching diagram type for activeAction: ${activeAction}`);
      }

      // Returns a diagramId we can use later for mutating updates
      insertDiagram({
        transactionId,
        // FIXME convert zoom to zoomScale
        postDiagramsRequestDTO: { diagramType, zoomScale: zoom, coordinates: cartesianCoordinates },
      });

      dispatch(setActiveAction("idle"));
    },
    enabled,
  });

  return undefined;
};
