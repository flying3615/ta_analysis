import { pull } from "lodash-es";
import { useEffect, useState } from "react";

export interface useWindowOpenHookProps {
  includeMainWindow?: boolean;
  enabled?: boolean;
  listeners?: Parameters<Window["addEventListener"]>[];
}

/**
 * Proxy and track window open
 */
export const useWindowOpenHook = ({ includeMainWindow, enabled = true, listeners = [] }: useWindowOpenHookProps) => {
  const [popupWindows, setPopupWindows] = useState<Window[]>(includeMainWindow ? [window] : []);

  useEffect(() => {
    const oldWindowOpen = window.open;
    // Don't override mocks in tests
    if (!enabled || "mockClear" in oldWindowOpen) return;

    window.open = (...args: Parameters<typeof window.open>) => {
      if (args[0] !== "") {
        // If it has an url it's an external window, we don't want to proxy that
        return oldWindowOpen(...args);
      }
      const newWindow = oldWindowOpen.call(window, ...args);
      if (!newWindow) return null;
      newWindow.addEventListener("beforeunload", () => {
        setPopupWindows((popupWindows) => [...pull(popupWindows, newWindow)]);
      });
      setPopupWindows((popupWindows) => [...popupWindows, newWindow]);
      return newWindow;
    };
    return () => {
      // Reset window back to old handler
      window.open = oldWindowOpen;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const listenersClone = [...listeners];
    const popupWindowsClone = [...popupWindows];
    popupWindowsClone.forEach((w: Window) => listenersClone?.forEach((l) => w.addEventListener(...l)));
    return () => {
      popupWindowsClone.forEach((w: Window) => listenersClone?.forEach((l) => w.removeEventListener(...l)));
    };
  }, [enabled, listeners, popupWindows]);

  return popupWindows;
};
