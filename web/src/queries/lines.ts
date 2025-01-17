import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { getLinesForOpenLayers, IFeatureSourceLine } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getLinesQueryKey = (transactionId: number) => ["lines", transactionId];

export const getLinesQuery = async (transactionId: number): Promise<IFeatureSourceLine[]> =>
  getLinesForOpenLayers(await new LinesControllerApi(apiConfig()).lines({ transactionId }));

export const useGetLinesQuery: PlanGenQuery<IFeatureSourceLine[]> = ({ transactionId, enabled }) =>
  useQuery({
    queryKey: getLinesQueryKey(transactionId),
    queryFn: () => getLinesQuery(transactionId),
    enabled,
  });
