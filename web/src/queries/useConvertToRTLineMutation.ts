import { ExtinguishedLinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { ConvertRequest } from "@linz/survey-plan-generation-api-client/src/apis/ExtinguishedLinesControllerApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines";

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useConvertToRTLineMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (props: ConvertRequest) => {
      const { ok, message } = await new ExtinguishedLinesControllerApi(apiConfig()).convert(props);
      if (!ok) {
        throw Error(message || "unexpected error");
      }
    },
    onSuccess: async (_, props) => {
      await queryClient.invalidateQueries({ queryKey: getLinesQueryKey(props.transactionId) });
    },
  });
};
