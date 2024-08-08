import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getLinesForOpenLayers } from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getLinesQueryKey = (transactionId: number) => ["lines", transactionId];

export const getLinesQuery = async (transactionId: number): Promise<IFeatureSource[]> =>
  getLinesForOpenLayers(await new LinesControllerApi(apiConfig()).lines({ transactionId }));

export const useGetLinesQuery: PlanGenQuery<IFeatureSource[]> = ({ transactionId, enabled }) =>
  useQuery({
    queryKey: getLinesQueryKey(transactionId),
    queryFn: () => getLinesQuery(transactionId),
    enabled,
  });

export const useUpdateLinesQueryData = (transactionId: number) => {
  const queryClient = useQueryClient();

  const removeLines = useCallback(
    (lineIds: number[]) => {
      queryClient.setQueryData<IFeatureSource[]>(
        getLinesQueryKey(transactionId),
        (list) => list?.filter((line) => !lineIds.includes(line.id ?? -1)) ?? [],
      );
    },
    [queryClient, transactionId],
  );

  return {
    removeLines,
  };
};
