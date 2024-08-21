import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import difference from "@turf/difference";
import { feature, featureCollection, geometry } from "@turf/helpers";
import intersect from "@turf/intersect";
import union from "@turf/union";
import { Feature, Polygon } from "geojson";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import {
  error32103_newShapeMustOverlapDiagram,
  error32104_invalidDiagram,
} from "@/components/DefineDiagrams/prefabErrors.tsx";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import {
  DrawEndProps,
  DrawInteractionType,
  useOpenLayersDrawInteraction,
} from "@/hooks/useOpenLayersDrawInteraction.ts";
import { getQueryDiagram } from "@/queries/diagrams.ts";
import { useUpdateDiagramMutation } from "@/queries/useUpdateDiagramMutation.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";
import { numericToCartesian } from "@/util/mapUtil.ts";

export interface useRemoveRtLineProps {
  transactionId: number;
  enabled: boolean;
  selectedDiagramIds: number[];
}

const actionToTypeMap: Partial<
  Record<DefineDiagramsActionType, { drawType: DrawInteractionType; combineFn: typeof union | typeof difference }>
> = {
  enlarge_diagram_rectangle: { drawType: "Rectangle", combineFn: union },
  enlarge_diagram_polygon: { drawType: "Polygon", combineFn: union },
  reduce_diagram_rectangle: { drawType: "Rectangle", combineFn: difference },
  reduce_diagram_polygon: { drawType: "Polygon", combineFn: difference },
};

export const useResizeDiagram = ({ transactionId, enabled, selectedDiagramIds }: useRemoveRtLineProps) => {
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();
  const { mutateAsync: updateDiagram } = useUpdateDiagramMutation(transactionId);

  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const { drawType, combineFn } = actionToTypeMap[activeAction] ?? {};

  const enlargeDiagram = useCallback(
    async ({ latLongCoordinates }: DrawEndProps) => {
      if (!selectedDiagramIds || isEmpty(selectedDiagramIds) || !combineFn) return;
      const diagramId = selectedDiagramIds[0];
      if (diagramId == null) return;

      const diagram = getQueryDiagram(queryClient, transactionId, diagramId);
      if (!diagram) return console.error(`Unable to find diagram with id ${diagramId} in queryData`); // This can't happen

      /**
       * Check drawn polygon overlaps elected polygon
       */
      const selectedPolygon = diagram.shape as Feature<Polygon>;
      const resizePolygon = feature(geometry("Polygon", [latLongCoordinates]) as Polygon);

      const collection = featureCollection([selectedPolygon, resizePolygon]);
      if (intersect(collection) === null) {
        await showPrefabModal(error32103_newShapeMustOverlapDiagram);
        dispatch(setActiveAction("idle"));
        return;
      }

      /**
       * Check combination of selected polygon and  drawn polygon don't create a multi-polygon
       */
      const combined = combineFn(collection);
      if (!combined || combined.geometry?.type !== "Polygon" || combined.geometry.coordinates.length > 1) {
        await showPrefabModal(error32104_invalidDiagram);
        dispatch(setActiveAction("idle"));
        return;
      }

      /**
       * Update the polygon
       */
      const co = combined.geometry.coordinates[0] ?? [];
      try {
        setLoading(true);
        await updateDiagram({
          diagramType: diagram.diagramType,
          geometry: combined.geometry,
          request: {
            transactionId,
            diagramId,
            updateDiagramRequestDTO: {
              coordinates: co.map(numericToCartesian),
            },
          },
        });
      } finally {
        setLoading(false);
        dispatch(setActiveAction("idle"));
      }
    },
    [selectedDiagramIds, combineFn, queryClient, transactionId, showPrefabModal, dispatch, updateDiagram],
  );

  useOpenLayersDrawInteraction({
    options: { type: drawType, stopClick: true },
    drawAbort: () => dispatch(setActiveAction("idle")),
    drawEnd: enlargeDiagram,
    enabled: enabled && !!drawType && !isEmpty(selectedDiagramIds),
  });

  return {
    loading,
  };
};
