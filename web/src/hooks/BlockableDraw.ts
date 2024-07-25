import Draw, { Options } from "ol/interaction/Draw";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { MutableRefObject } from "react";

/**
 * Extend draw to allow prevention of adding points for things like self intersecting shapes.
 * Also handles right click to remove last point/cancel interaction on empty.
 */
export class BlockableDraw extends Draw {
  allowDrawRef: MutableRefObject<boolean>;

  constructor(options: Options, allowDrawRef: MutableRefObject<boolean>) {
    super(options);
    this.allowDrawRef = allowDrawRef;
  }

  override handleEvent(mapBrowserEvent: MapBrowserEvent<MouseEvent>): boolean {
    if (mapBrowserEvent.type === "pointerdown") {
      if (mapBrowserEvent.originalEvent.buttons !== 1) {
        // @ts-expect-error access private is the easiest way to do this
        const sketchCoords = this.sketchLineCoords_;
        // Rectangle as no sketchCoords so just abort
        if (!sketchCoords || sketchCoords.length === 2) {
          // Removed last point so abort the interaction
          this.abortDrawing();
        } else {
          this.removeLastPoint();
          // Call this to get line that follows mouse to update immediately
          // @ts-expect-error access private is the easiest way to do this
          this.handlePointerMove_(mapBrowserEvent);
        }
        return false;
      }
    }

    if (mapBrowserEvent.type === "pointerdown" || mapBrowserEvent.type === "pointerup") {
      // Prevent adding point on condition.  This is used to prevent drawing self intersection polygons
      if (this.allowDrawRef?.current === false) {
        mapBrowserEvent.stopPropagation();
        mapBrowserEvent.preventDefault();
        return false;
      }
    }

    return super.handleEvent(mapBrowserEvent);
  }
}
