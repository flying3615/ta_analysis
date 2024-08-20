import { PlanControllerApi, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenMutation, PlanGenQuery } from "@/queries/types";
import { getPlanData, setPlanData } from "@/redux/planSheets/planSheetsSlice";

export const getPlanQueryKey = (transactionId: number) => ["getPlan", transactionId];

export const useGetPlanQuery: PlanGenQuery<PlanResponseDTO> = ({ transactionId, enabled }) => {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: getPlanQueryKey(transactionId),
    queryFn: async () => {
      const response = await new PlanControllerApi(apiConfig()).getPlan({ transactionId });
      dispatch(setPlanData(response));
      return response;
    },
    enabled,
  });
};

export const updatePlanQueryKey = (transactionId: number) => ["updatePlan", transactionId];

export const useUpdatePlanMutation: PlanGenMutation<void> = ({ transactionId, ...params }) => {
  const planData = useAppSelector(getPlanData);
  const queryClient = useQueryClient();

  return useMutation({
    ...params,
    mutationKey: updatePlanQueryKey(transactionId),
    mutationFn: () => new PlanControllerApi(apiConfig()).updatePlan({ transactionId, updatePlanRequestDTO: planData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
    },
  });
};
