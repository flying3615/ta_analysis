import { useEffect } from "react";

export const useOnKeyDown = (key: string | ((event: KeyboardEvent) => boolean), callback: () => void) => {
  const handler = (event: KeyboardEvent) => {
    if (typeof key === "string" ? event.key === key : key(event)) {
      event.preventDefault();
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  });
};
