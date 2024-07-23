import { PlanControllerApi, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenMutation, PlanGenQuery } from "@/queries/types";
import { getPlanData, setPlanData } from "@/redux/planSheets/planSheetsSlice";

import { queryClient } from ".";

export const getPlanQueryKey = (transactionId: number) => ["getPlan", transactionId];

export const useGetPlanQuery: PlanGenQuery<PlanResponseDTO> = ({ transactionId, ...params }) => {
  const dispatch = useAppDispatch();
  return useQuery({
    ...params,
    queryKey: getPlanQueryKey(transactionId),
    queryFn: async () => {
      const response = await new PlanControllerApi(apiConfig()).getPlan({ transactionId });
      dispatch(setPlanData(response));
      return response;
    },
  });
};

export const updatePlanQueryKey = (transactionId: number) => ["updatePlan", transactionId];

export const useUpdatePlanMutation: PlanGenMutation<void> = ({ transactionId, ...params }) => {
  const planData = useAppSelector(getPlanData);
  return useMutation({
    ...params,
    mutationKey: updatePlanQueryKey(transactionId),
    mutationFn: () => new PlanControllerApi(apiConfig()).updatePlan({ transactionId, updatePlanRequest: planData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
    },
  });
};
