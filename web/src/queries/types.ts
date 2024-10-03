import { PlanCompileRequest } from "@linz/survey-plan-generation-api-client";
import { UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

export const LINZ_CORRELATION_ID = "x-linz-correlation-id";

export interface PlanGenQueryOptions<TQueryFnData> extends Partial<UseQueryOptions<TQueryFnData>> {
  transactionId: number;
}

export type PlanGenQuery<TQueryFnData> = (
  params: PlanGenQueryOptions<TQueryFnData>,
) => UseQueryResult<TQueryFnData, Error>;

export interface PlanGenMutationOptions<TData, TError, TVariables>
  extends Partial<UseMutationOptions<TData, TError, TVariables>> {
  transactionId: number;
}

export type PlanGenMutation<TData, TError = Error, TVariables = void> = (
  params: PlanGenMutationOptions<TData, TError, TVariables>,
) => UseMutationResult<TData, TError, TVariables>;

export type PlanGenCompileMutation<TData, TError = Error, TVariables = PlanCompileRequest> = (
  params: PlanGenMutationOptions<TData, TError, TVariables>,
) => UseMutationResult<TData, TError, TVariables>;
