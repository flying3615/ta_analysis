import {
  PlanCompileRequest,
  PlanControllerApi,
  PlanGraphicsControllerApi,
  PlanResponseDTO,
  PreCompilePlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { useToast } from "@linzjs/lui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/reduxHooks";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import { normalizePlanData } from "@/modules/plan/normalizePlanData";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenCompileMutation, PlanGenMutation, PlanGenQuery } from "@/queries/types";
import { getPlanData } from "@/redux/planSheets/planSheetsSlice";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { performanceMeasure } from "@/util/interactionMeasurementUtil";

export const getPlanQueryKey = (transactionId: number) => ["getPlan", transactionId];

export const useGetPlanQuery: PlanGenQuery<PlanResponseDTO> = ({ transactionId, enabled }) => {
  const { adjustPlanData } = useAdjustLoadedPlanData();

  return useQuery({
    queryKey: getPlanQueryKey(transactionId),
    queryFn: async () => {
      const response = await performanceMeasure("getPlanData", transactionId, {
        workflow: "loadPlanXML",
      })(async () => new PlanControllerApi(apiConfig()).getPlan({ transactionId }));
      const adjustedResponse = await performanceMeasure("adjustedResponse", transactionId, {
        workflow: "loadPlanXML",
      })(() => Promise.resolve(adjustPlanData(response)));
      return adjustedResponse;
    },
    enabled,
  });
};

export const preCompilePlanQueryKey = (transactionId: number) => ["preCompilePlan", transactionId];

export const usePreCompilePlanCheck: PlanGenMutation<PreCompilePlanResponseDTO> = ({ transactionId, ...params }) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...params,
    mutationKey: preCompilePlanQueryKey(transactionId),
    mutationFn: () => new PlanGraphicsControllerApi(apiConfig()).prePlanCompile({ transactionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: preCompilePlanQueryKey(transactionId) }),
  });
};

export const updatePlanQueryKey = (transactionId: number) => ["updatePlan", transactionId];

export const useUpdatePlanMutation = (transactionId: number) => {
  const planData = useAppSelector(getPlanData) as PlanResponseDTO;
  const { result: irregularLineMidpointMode } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_MIDPOINT_IRREGULAR);

  return useMutation({
    mutationKey: updatePlanQueryKey(transactionId),
    mutationFn: () => {
      const normalizedPlanData = normalizePlanData(planData, irregularLineMidpointMode);
      const body = new Blob([JSON.stringify(normalizedPlanData)], { type: "application/json" });
      return new PlanControllerApi(apiConfig()).updatePlan({ transactionId, body });
    },
    // Explicitly don't invalidate the plan data here, as the async task won't have completed yet
  });
};

export const updateCompilePlanQueryKey = (transactionId: number) => ["compilePlan", transactionId];

export const useCompilePlanMutation: PlanGenCompileMutation<void> = ({ transactionId, ...params }) => {
  const { success: successToast } = useToast();

  return useMutation({
    ...params,
    mutationKey: updateCompilePlanQueryKey(transactionId),
    mutationFn: async (planCompilationRequest: PlanCompileRequest) => {
      return await new PlanGraphicsControllerApi(apiConfig()).planCompile(planCompilationRequest);
    },
    onSuccess: () => {
      successToast("Plan generation has been initiated successfully.");
    },
  });
};
