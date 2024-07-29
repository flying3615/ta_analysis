import { userEvent } from "@storybook/testing-library";
import { Map } from "ol";
import { Coordinate } from "ol/coordinate";

import { sleep } from "@/test-utils/storybook-utils.ts";

export const drawOnMap = async (coordinatesToClick: Coordinate[]) => {
  // eslint-disable-next-line testing-library/no-node-access
  const viewport = document.querySelector(".ol-viewport");
  /* eslint-disable */
  const map = (window as any).map as Map;

  if (!viewport || !map) {
    console.log("Viewport or map not defined", { viewport, map });
    return;
  }

  for (const coord of coordinatesToClick) {
    const pixel = map.getPixelFromCoordinate(coord);

    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: viewport,
      coords: {
        clientX: pixel[0],
        clientY: pixel[1],
      },
    });
    // set a delay between each click on map so we can see the clicks happening
    await sleep(500);
  }
};
