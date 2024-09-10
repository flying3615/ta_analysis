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

export const useOnKeyDownAndMouseDown = (
  key: string | ((event: KeyboardEvent) => boolean),
  mouseCondition: (event: MouseEvent) => boolean,
  callback: (event: MouseEvent) => void,
  mouseUpCallback?: (event: MouseEvent) => void,
) => {
  let isKeyPressed = false;

  const keyHandler = (event: KeyboardEvent) => {
    if (typeof key === "string" ? event.key === key : key(event)) {
      isKeyPressed = true;
    }
  };

  const mouseDownHandler = (event: MouseEvent) => {
    if (isKeyPressed && mouseCondition(event)) {
      event.preventDefault();
      callback(event);
    }
  };

  const mouseUpHandler = (event: MouseEvent) => {
    if (isKeyPressed && mouseUpCallback && mouseCondition(event)) {
      mouseUpCallback(event);
    }
  };

  const resetKeyState = () => {
    isKeyPressed = false;
  };

  useEffect(() => {
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", resetKeyState);
    document.addEventListener("mousedown", mouseDownHandler);
    document.addEventListener("mouseup", mouseUpHandler);

    return () => {
      document.removeEventListener("keydown", keyHandler);
      document.removeEventListener("keyup", resetKeyState);
      document.removeEventListener("mousedown", mouseDownHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
  });
};
