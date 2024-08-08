import { useEffect, useRef } from "react";

/**
 * Track previous values of states.
 *
 * @param value Value to track.
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

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
