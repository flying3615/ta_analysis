import {
  DefaultError,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

export interface PlanGenQueryOptions<TQueryFnData> extends Partial<UseQueryOptions<TQueryFnData>> {
  transactionId: number;
}

export type PlanGenQuery<TQueryFnData> = (params: PlanGenQueryOptions<TQueryFnData>) => UseQueryResult<TQueryFnData>;

export interface PlanGenMutationOptions<TData, TError, TVariables>
  extends Partial<UseMutationOptions<TData, TError, TVariables>> {
  transactionId: number;
}

export type PlanGenMutation<TData, TError = DefaultError, TVariables = void> = (
  params: PlanGenMutationOptions<TData, TError, TVariables>,
) => UseMutationResult<TData, TError, TVariables>;
