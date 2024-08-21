import { CartesianCoordsDTO } from "@linz/survey-plan-generation-api-client";
import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import area from "@turf/area";
import { geometry, polygon as tpolygon } from "@turf/helpers";
import { kinks } from "@turf/kinks";
import { LineString, Polygon } from "geojson";
import { isEmpty } from "lodash-es";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import BaseEvent from "ol/events/Event";
import { Polygon as olPolygon } from "ol/geom";
import { Type } from "ol/geom/Geometry";
import { Draw } from "ol/interaction";
import { createBox, DrawEvent, GeometryFunction, Options } from "ol/interaction/Draw";
import { useCallback, useContext, useEffect, useRef } from "react";

import {
  drawInteractionBoundaryBorder,
  drawInteractionBoundaryBorderError,
  drawInteractionBoundaryFill,
  drawInteractionBoundaryFillError,
} from "@/components/DefineDiagrams/diagramStyles.ts";
import { BlockableDraw } from "@/hooks/BlockableDraw.ts";
import { useConstFunction } from "@/hooks/useConstFunction.ts";
import { useHasChanged } from "@/hooks/useHasChanged.ts";
import { geometryToLatLongCartesian, geometryToLatLongCoordinates } from "@/util/mapUtil.ts";

type ExtendedDrawInteractionType = "Rectangle";

export type DrawInteractionType = Type | ExtendedDrawInteractionType;

/**
 * OpenLayers draw interaction doesn't support box, this extends the standard interaction options.
 */
const extendedTypes: Partial<Record<DrawInteractionType, () => { type: Type; geometryFunction: GeometryFunction }>> = {
  Rectangle: () => ({
    type: "Circle",
    geometryFunction: createBox(),
  }),
};

export interface DrawEndProps {
  event: DrawEvent;
  area: number;
  geometry: olPolygon;
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
  const currentFeatureRef = useRef<olPolygon>();

  const currentType = options.type;

  /**
   * Call back for draw end.  Garnishes the normal DrawEvent with some more useful values.
   */
  const onDrawEndEvent = useConstFunction((event: DrawEvent) => {
    event.stopPropagation();
    const polygon = currentFeatureRef.current;
    if (!polygon) return;

    const latLongCartesians = geometryToLatLongCartesian(polygon);
    const latLongCoordinates = geometryToLatLongCoordinates(polygon);
    const featureArea = area(tpolygon([latLongCoordinates]));

    // Prevent further drawing during save
    allowDrawAddPoint.current = false;

    drawEnd({
      event,
      area: featureArea,
      latLongCoordinates,
      geometry: polygon,
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

      const evFeature = event.feature;
      drawListenerRef.current = evFeature.getGeometry()?.on("change", (evt: BaseEvent) => {
        const geom = evt.target as olPolygon;
        currentFeatureRef.current = geom;
        if (geom.getType() !== "Polygon") throw "Unsupported Geometry type";

        // Disable the ability to add a point if it would cause a self intersection.
        // The last coordinate hasn't been saved yet, so it's excluded
        const coordinates = geom.getCoordinates()[0] ?? [];
        allowDrawAddPoint.current =
          coordinates.length <= 4 ||
          isEmpty(kinks(geometry("LineString", coordinates.slice(0, -1)) as LineString).features);

        if (maxPoints) {
          const pointCount = coordinates.length - 1;
          if (pointCount > maxPoints.count) {
            maxPoints.errorCallback();
            drawInteractionRef.current?.abortDrawing();
          }
        }
      });
    },
    [map, maxPoints],
  );

  /**
   * Add draw interaction if no present.
   */
  const addInteractions = useCallback(() => {
    /**
     * Checks if geometry is self intersecting
     */
    const finishCondition = () => {
      const c = currentFeatureRef.current?.getFlatCoordinates();
      if (!c) return false;

      const k = kinks(geometry("Polygon", [c]) as Polygon);
      return isEmpty(k.features);
    };

    allowDrawAddPoint.current = true;
    if (!map || !enabled || drawInteractionRef.current || !currentType) return;
    const drawInteraction = (drawInteractionRef.current = new BlockableDraw(
      {
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
        ...options,
        ...extendedTypes[currentType]?.(),
        finishCondition,
      } as Options,
      allowDrawAddPoint,
    ));

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
