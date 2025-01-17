import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useContext } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { error32027_abuttalTooManyPoints } from "@/components/DefineDiagrams/prefabErrors";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useOpenLayersDrawInteraction } from "@/hooks/useOpenLayersDrawInteraction";
import { useTransactionId } from "@/hooks/useTransactionId";
import { InsertAbuttalLineError, useInsertAbuttalLineMutation } from "@/queries/useInsertAbuttalLineMutation";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { useShowToast } from "@/util/showToast";

const maxPoints = 47;

export const useDrawAbuttal = () => {
  const transactionId = useTransactionId();

  const { showErrorToast } = useShowToast();
  const { map } = useContext(LolOpenLayersMapContext);
  const { showPrefabModal } = useLuiModalPrefab();

  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const { mutateAsync: insertAbuttalLine, isPending: loading } = useInsertAbuttalLineMutation(transactionId);

  const enabled = activeAction === "draw_abuttal";

  const setAction = (action: DefineDiagramsActionType) => dispatch(setActiveAction(action));

  const drawAbort = () => setAction("idle");

  useOpenLayersDrawInteraction({
    enabled,
    options: { type: "LineString" },
    maxPoints: {
      count: maxPoints,
      errorCallback: () => void showPrefabModal(error32027_abuttalTooManyPoints(maxPoints)),
    },
    drawEnd: async ({ latLongCartesians }) => {
      if (!map) return;

      try {
        await insertAbuttalLine({
          transactionId,
          createLineRequestDTO: { coordinates: latLongCartesians },
        });
      } catch (ex) {
        const reason = (ex instanceof InsertAbuttalLineError && ex.message) || "unknown reason";
        showErrorToast(`Create abuttal line failed due to ${reason}`);
      } finally {
        drawAbort();
      }
    },
    drawAbort,
  });

  return {
    loading,
  };
};
