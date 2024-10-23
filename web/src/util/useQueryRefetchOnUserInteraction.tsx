import { DefaultError } from "@tanstack/query-core";
import { QueryObserverOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { useWindowOpenHook } from "@/util/useWindowOpenHook";

export interface useCreateAndMaintainLockResult {
  lockOwnedByUser?: boolean;
}

/**
 * Re-fetches queries if user interacts with the application, obeying original useQuery's options.
 * Remember to set the staleTime in original useQuery options, otherwise you would get 100's of requests on mouseMove.
 *
 * @param queryOptions Query options
 */
export const useQueryRefetchOnUserInteraction = <TQueryData = unknown,>(
  queryOptions: QueryObserverOptions<unknown, DefaultError, TQueryData>,
) => {
  const queryClient = useQueryClient();
  const hasErrored = useRef(false);

  if (!queryOptions.staleTime && !hasErrored.current) {
    // For developers on localhost only for error toasts
    const isLocalhost = document.location.href.indexOf("http://localhost:") === 0;

    if (isLocalhost && !hasErrored.current) {
      const message = `useQueryRefetchOnUserInteraction useQuery options is missing a staleTime`;
      console.error(message, queryOptions);
      // This can only show up in dev.  It's breaking level important hence an alert not a toast.
      alert(message);
      hasErrored.current = true;
    }
  }

  /**
   * On any event refresh relevant queries (assuming staleTime has expired)
   */
  const anyEvent = useCallback(() => {
    // We have to prefetch query as invalidate will ignore the stale-time
    // We also have to check enabled as prefetch ignores enabled
    if (queryOptions.enabled !== false) {
      void queryClient.prefetchQuery(queryOptions);
    }
  }, [queryOptions, queryClient]);

  /**
   * Proxy window open so that we can add event handlers to popout windows.
   */
  useWindowOpenHook({
    enabled: queryOptions.enabled !== false,
    includeMainWindow: true,
    listeners: [
      ["mousemove", anyEvent, { capture: true }],
      ["keypress", anyEvent, { capture: true }],
    ],
  });

  return useQuery<unknown, DefaultError, TQueryData>(queryOptions);
};
