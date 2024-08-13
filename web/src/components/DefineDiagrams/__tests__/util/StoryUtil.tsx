import { userEvent } from "@storybook/testing-library";
import { Map } from "ol";
import { Coordinate } from "ol/coordinate";

import { sleep } from "@/test-utils/storybook-utils";

export const drawOnMap = async (coordinatesToClick: Coordinate[]) => {
  /* eslint-disable */
  const map = (window as any).map as Map;
  const viewport = map.getViewport();

  if (!viewport || !map) {
    console.log("Viewport or map not defined", { viewport, map });
    return;
  }

  const domRect = viewport.getBoundingClientRect();
  for (const coord of coordinatesToClick) {
    const pixel = map.getPixelFromCoordinate(coord);
    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: viewport,
      coords: {
        clientX: (pixel[0]??0) + domRect.x,
        clientY: (pixel[1]??0) + domRect.y,
      },
    });
    // set a delay between each click on map so we can see the clicks happening
    await sleep(500);
  }
};
