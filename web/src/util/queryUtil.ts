import { QueryKey } from "@tanstack/query-core";
import { useQueryClient } from "@tanstack/react-query";
import { negate, sortBy } from "lodash-es";
import { useCallback } from "react";

export interface useQueryDataUpdateUpdatePropsWithItem<T> {
  match: (item: T) => boolean;
  withItem: T;
  withProps?: never;
}

export interface useQueryDataUpdateUpdatePropsWithProps<T> {
  match: (item: T) => boolean;
  withItem?: never;
  withProps: Partial<T>;
}

export type useQueryDataUpdateUpdateProps<T> =
  | useQueryDataUpdateUpdatePropsWithItem<T>
  | useQueryDataUpdateUpdatePropsWithProps<T>;

export interface useQueryDataAppendProps<T> {
  newItem: T;
}

export interface useQueryDataRemoveProps<T> {
  match: (item: T) => boolean;
}

export const useQueryDataUpdate = <T>({
  queryKey,
  sortBy: _sortBy,
}: {
  queryKey: QueryKey;
  sortBy?: (value: T) => number;
}) => {
  const queryClient = useQueryClient();

  const getItem = useCallback(
    (match: (item: T) => boolean) => queryClient.getQueryData<T[]>(queryKey)?.find(match),
    [queryClient, queryKey],
  );

  const updateQueryData = useCallback(
    ({ match, withItem, withProps }: useQueryDataUpdateUpdateProps<T>) => {
      // Update temp diagrams Id
      queryClient.setQueryData<T[]>(queryKey, (list) => {
        if (!list) return undefined;

        const r = list.map((item) => {
          if (!match(item)) return item;
          if (withItem) return withItem;
          return { ...item, ...withProps };
        });
        return _sortBy ? sortBy(r, _sortBy) : r;
      });
    },
    [_sortBy, queryClient, queryKey],
  );

  const appendQueryData = ({ newItem }: useQueryDataAppendProps<T>) => {
    queryClient.setQueryData<T[]>(queryKey, (list) => {
      const r = [...(list ?? []), newItem];
      return _sortBy ? sortBy(r, _sortBy) : r;
    });
  };

  const removeQueryData = ({ match }: useQueryDataRemoveProps<T>) => {
    queryClient.setQueryData<T[]>(queryKey, (list) => list?.filter(negate(match)));
  };

  return {
    getItem,
    appendQueryData,
    removeQueryData,
    updateQueryData,
  };
};

export const byId =
  (id: number[] | number) =>
  (obj: Partial<{ id: number | undefined }>): boolean =>
    id !== undefined && (obj.id === id || !!(Array.isArray(id) && obj.id && id.includes(obj.id)));

/**
 * Adds an id column to data list such that it can work with step-ag-grid
 */
export const withId = <T, K extends keyof T>(list: T[], idField: K) =>
  list.map((r) => ({ ...r, id: r[idField] })) as (T & { id: T[K] })[];

export const withIdUndef = <T, K extends keyof T>(list: T[] | undefined, idField: K) =>
  list ? withId(list, idField) : undefined;
