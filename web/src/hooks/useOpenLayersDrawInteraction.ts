import { CartesianCoordsDTO } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import area from "@turf/area";
import { geometry, polygon as tpolygon } from "@turf/helpers";
import { kinks } from "@turf/kinks";
import { LineString, Polygon } from "geojson";
import { isEmpty, isEqual } from "lodash-es";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import BaseEvent from "ol/events/Event";
import { LineString as OlLineString, Polygon as OlPolygon } from "ol/geom";
import { Type } from "ol/geom/Geometry";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import { Draw } from "ol/interaction";
import { createBox, DrawEvent, GeometryFunction, Options } from "ol/interaction/Draw";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { useCallback, useContext, useEffect, useRef } from "react";

import {
  drawInteractionBoundaryBorder,
  drawInteractionBoundaryBorderError,
  drawInteractionBoundaryFill,
  drawInteractionBoundaryFillError,
} from "@/components/DefineDiagrams/diagramStyles";
import { useConstFunction } from "@/hooks/useConstFunction";
import { useHasChanged } from "@/hooks/useHasChanged";
import { geometryToLatLongCartesian, geometryToLatLongCoordinates } from "@/util/mapUtil";

type ExtendedDrawInteractionType = "Rectangle" | "Line";

export type DrawInteractionType = Type | ExtendedDrawInteractionType;

/**
 * OpenLayers draw interaction doesn't support box, this extends the standard interaction options.
 */
const extendedTypes: Partial<Record<DrawInteractionType, () => { type: Type; geometryFunction: GeometryFunction }>> = {
  Rectangle: () => ({
    type: "Circle",
    geometryFunction: createBox(),
  }),
  Line: () => ({
    type: "Circle",
    geometryFunction: ((coords: Coordinate[], geom: SimpleGeometry) => {
      if (!geom) {
        geom = new OlLineString(coords);
      } else {
        geom.setCoordinates(coords);
      }
      return geom;
    }) as GeometryFunction,
  }),
};

export interface DrawEndProps {
  event: DrawEvent;
  area: number;
  geometry: SimpleGeometry;
  latLongCoordinates: Coordinate[];
  latLongCartesians: CartesianCoordsDTO[];
}

export interface useOpenLayersDrawInteractionProps {
  drawAbort: (event: DrawEvent) => unknown;
  drawEnd: (props: DrawEndProps) => unknown;
  enabled: boolean;
  options: Omit<Options, "type"> & { type: DrawInteractionType | undefined };
  maxPoints?: {
    count: number;
    errorCallback: () => void;
  };
}

/**
 * Manages map draw interaction.
 *
 * @param drawAbort When user cancels draw by right click or escape this is called.
 * @param drawEnd On draw end event callback
 * @param enabled true if enabled
 * @param maxPoints Limit to number of points in polygon if required.
 * @param options Standard ol draw interaction properties, extended to include custom type: "Rectangle"
 */
export const useOpenLayersDrawInteraction = ({
  drawAbort,
  drawEnd,
  enabled,
  maxPoints,
  options,
}: useOpenLayersDrawInteractionProps) => {
  const { map } = useContext(LolOpenLayersMapContext);

  const drawInteractionRef = useRef<Draw>();
  const drawListenerRef = useRef<EventsKey>();
  // If the polygon is self intersecting this is set to false
  const allowDrawAddPoint = useRef(false);
  const preventDrawAbortDuringTypeChange = useRef(false);
  // The current feature needs to be retained as it's needed for finishEvent which has no access to the feature
  const currentFeatureRef = useRef<SimpleGeometry>();

  const currentType = options.type;

  /**
   * Call back for draw end.  Garnishes the normal DrawEvent with some more useful values.
   */
  const onDrawEndEvent = useConstFunction((event: DrawEvent) => {
    event.stopPropagation();
    const feature = currentFeatureRef.current;
    if (!feature) return;

    const latLongCartesians = geometryToLatLongCartesian(feature);
    const latLongCoordinates = geometryToLatLongCoordinates(feature);
    const featureArea =
      currentType === "Polygon" || currentType === "Rectangle" ? area(tpolygon([latLongCoordinates])) : 0;

    // Prevent further drawing during save
    allowDrawAddPoint.current = false;
    drawEnd({
      event,
      area: featureArea,
      latLongCoordinates,
      geometry: feature,
      latLongCartesians,
    });
  });

  /**
   * Callback for draw abort.
   */
  const onDrawAbortEvent = useConstFunction((event: DrawEvent) => {
    if (preventDrawAbortDuringTypeChange.current) return;
    event.stopPropagation();
    drawAbort(event);
  });

  /**
   * Only hooked in if the maxPoints validation is added.
   * Checks number of points and calls error callback if exceeded, then aborts the interaction.
   */
  const onDrawStart = useCallback(
    (event: DrawEvent) => {
      if (!map) return;

      const polygonValidator = (geom: OlPolygon) => {
        // Disable the ability to add a point if it would cause a self intersection.
        // The last coordinate hasn't been saved yet, so it's excluded
        const coordinates = geom.getCoordinates()[0] ?? [];
        allowDrawAddPoint.current =
          coordinates.length <= 4 ||
          isEmpty(kinks(geometry("LineString", coordinates.slice(0, -1)) as LineString).features);

        if (maxPoints && coordinates.length - 1 > maxPoints.count) {
          maxPoints.errorCallback();
          drawInteractionRef.current?.abortDrawing();
        }
      };

      const lineStringValidator = (geom: OlLineString) => {
        // Disable the ability to add a point if it would cause a self intersection.
        const coordinates = geom.getCoordinates() ?? [];
        allowDrawAddPoint.current =
          coordinates.length <= 3 || isEmpty(kinks(geometry("LineString", coordinates) as LineString).features);

        if (maxPoints && coordinates.length > maxPoints.count) {
          maxPoints.errorCallback();
          drawInteractionRef.current?.abortDrawing();
        }
      };

      drawListenerRef.current = event.feature.getGeometry()?.on("change", (evt: BaseEvent) => {
        currentFeatureRef.current = evt.target as SimpleGeometry;

        switch (currentType) {
          case "Line":
          case "Rectangle":
            // empty
            break;
          case "Polygon":
            polygonValidator(evt.target as OlPolygon);
            break;
          case "LineString":
            lineStringValidator(evt.target as OlLineString);
            break;
          default:
            alert(`Unsupported Geometry type ${currentType}`);
        }
      });
    },
    [currentType, map, maxPoints],
  );

  /**
   * Add draw interaction if no present.
   */
  const addInteractions = useCallback(() => {
    /**
     * Checks if geometry is self intersecting
     */
    const finishCondition = () => {
      if (currentType !== "Polygon") return true;

      const rings = (currentFeatureRef.current?.getCoordinates() as Coordinate[][]) ?? [];

      // Multi-polygon or no polygon then it's invalid
      if (rings.length !== 1) return false;

      const coords = rings[0];
      if (!coords) return false;

      // Displayed polygon has duplicate points that were for display only, these need removing to test for kinks
      for (let i = 1; i < coords.length; i++) {
        // If previous coordinate equals current coordinate then remove it
        if (isEqual(coords[i - 1], coords[i])) {
          coords.splice(i, 1);
        }
      }
      if (!coords) return false;

      const k = kinks(geometry("Polygon", [coords]) as Polygon);
      return isEmpty(k.features);
    };

    allowDrawAddPoint.current = true;
    if (!map || !enabled || drawInteractionRef.current || !currentType) return;
    const drawInteraction = (drawInteractionRef.current = new Draw({
      style: (feature) => {
        switch (feature.getGeometry()?.getType()) {
          case "LineString":
            return allowDrawAddPoint.current ? drawInteractionBoundaryBorder : drawInteractionBoundaryBorderError;
          case "Polygon":
            return allowDrawAddPoint.current ? drawInteractionBoundaryFill : drawInteractionBoundaryFillError;
          default:
            return false;
        }
      },
      stopClick: true,
      condition: (e: MapBrowserEvent<MouseEvent>) => {
        if (e.type === "pointerdown") {
          if (e.originalEvent.buttons === 2) {
            drawInteractionRef.current?.removeLastPoint();
            // @ts-expect-error private method, but needed to update screen
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            drawInteractionRef.current?.handlePointerMove_(e);
            return false;
          }
        }
        return allowDrawAddPoint?.current;
      },
      ...options,
      ...extendedTypes[currentType]?.(),
      finishCondition,
    } as Options));

    drawInteraction.on("drawstart", onDrawStart);
    drawInteraction.on("drawend", onDrawEndEvent);
    drawInteraction.on("drawabort", onDrawAbortEvent);

    map.addInteraction(drawInteraction);
  }, [map, enabled, currentType, options, onDrawStart, onDrawEndEvent, onDrawAbortEvent]);

  /**
   * Remove draw interaction if present.
   */
  const removeInteractions = useCallback(() => {
    if (!map) return;

    const drawInteraction = drawInteractionRef.current;
    drawInteraction && map.removeInteraction(drawInteraction);
    drawInteractionRef.current = undefined;
  }, [map]);

  /**
   * If the interaction type changes, then re-add interactions.
   * This allows changing whilst the interaction is active from draw e.g. polygon to box
   */
  const typeChanged = useHasChanged(currentType);
  useEffect(() => {
    if (!typeChanged) return;

    preventDrawAbortDuringTypeChange.current = true;
    removeInteractions();
    currentType && addInteractions();
    preventDrawAbortDuringTypeChange.current = false;
  }, [addInteractions, typeChanged, currentType, removeInteractions]);

  /**
   * Dis/enable the drawInteraction if enabled state changes
   */
  const enabledChanged = useHasChanged(enabled);
  useEffect(() => {
    if (!enabledChanged) return;
    enabled ? addInteractions() : removeInteractions();
  }, [addInteractions, enabled, enabledChanged, removeInteractions]);

  /**
   * When unmounting remove the map interactions
   */
  useEffect(() => {
    return () => {
      removeInteractions();
    };
  }, [removeInteractions]);
};
