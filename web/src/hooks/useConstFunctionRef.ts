import { useEffect, useRef } from "react";

/**
 * When calling external non-react components, and you can't update the function ref when state changes, use this to
 * proxy the dynamic function with a static ref.
 */
export const useConstFunctionRef = <TFn>(fn: TFn): React.MutableRefObject<TFn> => {
  const functionRef = useRef<TFn>(fn);

  useEffect(() => {
    functionRef.current = fn;
  }, [fn]);

  return functionRef;
};
