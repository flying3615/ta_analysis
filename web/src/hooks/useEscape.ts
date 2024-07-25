import { useEffect } from "react";

import { useConstFunctionRef } from "@/hooks/useConstFunctionRef.ts";

export interface useEscapeKeyProps {
  enabled: boolean | undefined;
  callback: () => unknown | Promise<unknown>;
}

/**
 * Handles registering and de-registering of escape key handler in workflow.
 *
 * @param handler Handler for escape key.
 * @param enabled Handler for escape key.
 */
export const useEscapeKey = ({ callback, enabled }: useEscapeKeyProps): void => {
  const escapeHandlerRef = useConstFunctionRef(callback);

  /** Register keyboard event handlers */
  useEffect(() => {
    if (enabled) {
      /**
       * Prevent listeners of keydown from handling escape
       */
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      /**
       * Handle escape
       */
      const onKeyUp = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          escapeHandlerRef.current();
        }
      };

      document.addEventListener("keyup", onKeyUp, { capture: true });
      document.addEventListener("keydown", onKeyDown, { capture: true });
      return () => {
        document.removeEventListener("keyup", onKeyUp, { capture: true });
        document.removeEventListener("keydown", onKeyDown, { capture: true });
      };
    }
    return;
  }, [enabled, escapeHandlerRef]);
};
