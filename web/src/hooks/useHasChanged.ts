import { usePrevious } from "@/hooks/usePrevious.ts";

/**
 * Returns true if value has changed since last update.
 *
 * @param value Value to monitor for change.
 * @param includeInitialState Usually values are undefined initially, by default the initial setState is ignored.
 * Set this to true such as not to ignore it.
 */
export const useHasChanged = <T>(value: T, includeInitialState: boolean = false): boolean => {
  const previous = usePrevious(value);
  return (includeInitialState || previous !== undefined) && previous !== value;
};
