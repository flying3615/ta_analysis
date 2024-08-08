import { useEffect, useRef } from "react";

/**
 * When calling external non-react components, and you can't update the function when state changes,
 * use this to proxy the dynamic function with a static function.
 */
export const useConstFunction = <Args extends never[], R, TFn extends (...args: Args) => R>(fn: TFn): TFn => {
  const functionRef = useRef<TFn>(fn);
  const proxyRef = useRef<TFn>(((...args: Args) => functionRef.current(...args)) as TFn);

  useEffect(() => {
    functionRef.current = fn;
  }, [fn]);

  return proxyRef.current;
};
