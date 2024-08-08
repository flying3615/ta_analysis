import { useEffect } from "react";

import { useConstFunction } from "@/hooks/useConstFunction.ts";

export interface useEscapeKeyProps {
  enabled?: boolean;
  callback: () => unknown;
}

/**
 * Handles registering and de-registering of escape key handler in workflow.
 *
 * @param handler Handler for escape key.
 * @param enabled Handler for escape key.
 */
export const useEscapeKey = ({ callback, enabled }: useEscapeKeyProps): void => {
  const escapeHandler = useConstFunction(callback);

  /** Register keyboard event handlers */
  useEffect(() => {
    if (enabled !== false) {
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
          escapeHandler();
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
  }, [enabled, escapeHandler]);
};
