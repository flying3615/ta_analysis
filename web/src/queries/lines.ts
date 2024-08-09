import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useQuery } from "@tanstack/react-query";

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
