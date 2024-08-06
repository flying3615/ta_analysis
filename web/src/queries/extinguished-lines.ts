import { ExtinguishedLinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";

import { getExtinguishedLinesForOpenLayers } from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";

export const getExtinguishedLinesQueryKey = (transactionId: number) => ["extinguished-lines", transactionId];

export const getExtinguishedLinesQuery = async (transactionId: number): Promise<IFeatureSource[]> =>
  getExtinguishedLinesForOpenLayers(
    await new ExtinguishedLinesControllerApi(apiConfig()).getExtinguishedLines({ transactionId }),
  );
