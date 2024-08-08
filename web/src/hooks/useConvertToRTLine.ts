import { ExtinguishedLinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { useShowLUIMessage } from "@linzjs/lui";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

export interface useConvertToRTLineProps {
  transactionId: number;
  selectedExtinguishedLineIds: number[] | null;
}

export const useConvertToRTLine = ({ transactionId, selectedExtinguishedLineIds }: useConvertToRTLineProps) => {
  const [loading, setLoading] = useState(false);
  const showMessage = useShowLUIMessage();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const convertRtLines = useCallback(async () => {
    if (!selectedExtinguishedLineIds || isEmpty(selectedExtinguishedLineIds)) return;

    setLoading(true);
    try {
      const result = await new ExtinguishedLinesControllerApi(apiConfig()).convert({
        transactionId: transactionId,
        extinguishedLinesConvertRequestDTO: { lineIds: selectedExtinguishedLineIds },
      });
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: getLinesQueryKey(transactionId) });
        const lineCount = selectedExtinguishedLineIds.length;
        const message = lineCount === 1 ? "RT Line successfully added" : "RT Lines successfully added";
        showMessage({
          message: message,
          messageType: "toast",
          messageLevel: "success",
          requireDismiss: false,
        });
      } else {
        showMessage({
          message: result?.message ?? "Unexpected exception adding RT-Lines",
          messageType: "toast",
          messageLevel: "error",
          requireDismiss: false,
        });
      }
    } finally {
      setLoading(false);
      dispatch(setActiveAction("idle"));
    }
  }, [dispatch, selectedExtinguishedLineIds, queryClient, showMessage, transactionId]);

  return {
    convertRtLines,
    loading,
  };
};
