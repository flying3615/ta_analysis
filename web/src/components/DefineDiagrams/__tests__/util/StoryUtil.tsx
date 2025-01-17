import { userEvent } from "@storybook/testing-library";
import { Map } from "ol";
import { Coordinate } from "ol/coordinate";

import { sleep } from "@/test-utils/storybook-utils";

export const drawOnMap = async (coordinatesToClick: Coordinate[], keyToPressWhileClicking?: string) => {
  /* eslint-disable */
  const user = userEvent.setup();
  const map = (window as any).map as Map;
  const viewport = map.getViewport();

  if (!viewport || !map) {
    console.log("Viewport or map not defined", { viewport, map });
    return;
  }

  const domRect = viewport.getBoundingClientRect();
  if (typeof keyToPressWhileClicking !== "undefined") {
    await user.keyboard("{" + keyToPressWhileClicking + ">}"); // press and hold key
  }
  for (const coord of coordinatesToClick) {
    const pixel = map.getPixelFromCoordinate(coord);
    await user.pointer({
      keys: "[MouseLeft]",
      target: viewport,
      coords: {
        clientX: (pixel[0] ?? 0) + domRect.x,
        clientY: (pixel[1] ?? 0) + domRect.y,
      },
    });
    await sleep(500);
  }
  if (typeof keyToPressWhileClicking !== "undefined") {
    await user.keyboard("{/" + keyToPressWhileClicking + "}"); // release key
  }
};

export const doubleClickOnMap = async (coordinateToClick: Coordinate) => {
  /* eslint-disable */
  const map = (window as any).map as Map;
  const viewport = map.getViewport();

  if (!viewport || !map) {
    console.log("Viewport or map not defined", { viewport, map });
    return;
  }

  const domRect = viewport.getBoundingClientRect();
  const pixel = map.getPixelFromCoordinate(coordinateToClick);
  await userEvent.pointer({
    keys: "[MouseLeft][MouseLeft]",
    target: viewport,
    coords: {
      clientX: (pixel[0] ?? 0) + domRect.x,
      clientY: (pixel[1] ?? 0) + domRect.y,
    },
  });
  await sleep(500);
};
