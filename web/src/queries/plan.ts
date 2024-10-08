import {
  PlanCompileRequest,
  PlanControllerApi,
  PlanGraphicsControllerApi,
  PlanResponseDTO,
  PlanTempControllerApi,
  PreCompilePlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import type { CompilePlanResponseDTO } from "@linz/survey-plan-generation-api-client/src/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { adjustLoadedPlanData } from "@/modules/plan/adjustLoadedPlanData.ts";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenCompileMutation, PlanGenMutation, PlanGenQuery } from "@/queries/types";
import { getPlanData, setPlanData } from "@/redux/planSheets/planSheetsSlice";

export const getPlanQueryKey = (transactionId: number) => ["getPlan", transactionId];

export const useGetPlanQuery: PlanGenQuery<PlanResponseDTO> = ({ transactionId, enabled }) => {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: getPlanQueryKey(transactionId),
    queryFn: async () => {
      const response = await new PlanControllerApi(apiConfig()).getPlan({ transactionId });
      const adjustedResponse = adjustLoadedPlanData(response);
      dispatch(setPlanData(adjustedResponse));
      return response;
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

export const useUpdatePlanMutation: PlanGenMutation<void> = ({ transactionId, ...params }) => {
  const planData = useAppSelector(getPlanData);
  const queryClient = useQueryClient();

  return useMutation({
    ...params,
    mutationKey: updatePlanQueryKey(transactionId),
    mutationFn: () =>
      new PlanTempControllerApi(apiConfig()).updatePlanTemp({ transactionId, updatePlanRequestDTO: planData }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) }),
  });
};

export const updateCompilePlanQueryKey = (transactionId: number) => ["compilePlan", transactionId];

export const useCompilePlanMutation: PlanGenCompileMutation<CompilePlanResponseDTO> = ({
  transactionId,
  ...params
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...params,
    mutationKey: updateCompilePlanQueryKey(transactionId),
    mutationFn: async (planCompilationRequest: PlanCompileRequest) => {
      return await new PlanGraphicsControllerApi(apiConfig()).planCompile(planCompilationRequest);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) }),
  });
};
