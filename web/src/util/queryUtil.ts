import { QueryKey } from "@tanstack/query-core";
import { useQueryClient } from "@tanstack/react-query";
import { sortBy } from "lodash-es";
import { useCallback } from "react";

export interface useQueryDataUpdateUpdatePropsWithItem<T> {
  updateItem: T | ((item: T) => boolean);
  withItem: T;
  withProps?: never;
}

export interface useQueryDataUpdateUpdatePropsWithProps<T> {
  updateItem: T | ((item: T) => boolean);
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
  remove: number[] | T | T[] | ((item: T) => boolean);
}

export const useQueryDataUpdate = <T>({
  queryKey,
  sortBy: _sortBy,
}: {
  queryKey: QueryKey;
  sortBy?: (value: T) => number;
}) => {
  const queryClient = useQueryClient();

  const updateQueryData = useCallback(
    ({ updateItem, withItem, withProps }: useQueryDataUpdateUpdateProps<T>) => {
      // Update temp diagrams Id
      queryClient.setQueryData<T[]>(queryKey, (list: T[] | undefined) => {
        if (!list) return undefined;

        const matcher =
          typeof updateItem === "function" //
            ? (updateItem as (item: T) => boolean)
            : (item: T) => item === updateItem;

        const r = list.map((item) => {
          if (!matcher(item)) return item;
          if (withItem) return withItem;
          return {
            ...item,
            ...withProps,
          };
        });
        return _sortBy ? sortBy(r, _sortBy) : r;
      });
    },
    [_sortBy, queryClient, queryKey],
  );

  const appendQueryData = ({ newItem }: useQueryDataAppendProps<T>) => {
    queryClient.setQueryData<T[]>(queryKey, (list: T[] | undefined) => {
      const r = [...(list ?? []), newItem];
      return _sortBy ? sortBy(r, _sortBy) : r;
    });
  };

  const removeQueryData = ({ remove }: useQueryDataRemoveProps<T>) => {
    const matcher =
      typeof remove === "function" //
        ? (remove as (item: T) => boolean)
        : (item: T) =>
            Array.isArray(remove)
              ? remove.some((i) => item === i || (item as { id: number }).id === i)
              : item === remove;

    queryClient.setQueryData<T[]>(queryKey, (list: T[] | undefined) => {
      if (!list) return undefined;
      return list.filter((item) => !matcher(item));
    });
  };

  return {
    appendQueryData,
    removeQueryData,
    updateQueryData,
  };
};
