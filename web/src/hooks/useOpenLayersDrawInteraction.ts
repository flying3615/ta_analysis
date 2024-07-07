import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import Geometry, { Type } from "ol/geom/Geometry";
import { Draw } from "ol/interaction";
import { createBox, DrawEvent, GeometryFunction, Options } from "ol/interaction/Draw";
import { useCallback, useContext, useEffect, useRef } from "react";

import { useConstFunctionRef } from "@/hooks/useConstFunctionRef.ts";
import { usePrevious } from "@/hooks/usePrevious.ts";

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

export interface useOpenLayersDrawInteractionProps {
  drawEnd: (props: { event: DrawEvent; geometry: Geometry }) => void;
  enabled: boolean;
  options: Omit<Options, "type"> & { type: DrawInteractionType | undefined };
}

/**
 * Manages map draw interaction.
 *
 * @param drawEnd On draw end event callback
 * @param enabled true if enabled
 * @param options Standard ol draw interaction properties, extended to include custom type: "Rectangle"
 */
export const useOpenLayersDrawInteraction = ({ drawEnd, enabled, options }: useOpenLayersDrawInteractionProps) => {
  const { map } = useContext(LolOpenLayersMapContext);
  const drawInteractionRef = useRef<Draw>();
  const drawEndEventRef = useConstFunctionRef((event: DrawEvent) => {
    event.stopPropagation();
    const geometry = event.feature.getGeometry();
    if (!geometry) return;

    drawEnd({ event, geometry });
  });

  const currentType = options.type;

  /**
   * Add draw interaction if no present.
   */
  const addInteractions = useCallback(() => {
    if (!map || !enabled || drawInteractionRef.current || !currentType) return;

    const drawInteraction = (drawInteractionRef.current = new Draw({
      ...options,
      ...extendedTypes[currentType]?.(),
    } as Options));
    drawInteraction.on("drawend", drawEndEventRef.current);
    map.addInteraction(drawInteraction);
  }, [currentType, drawEndEventRef, enabled, map, options]);

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
  const lastType = usePrevious(currentType);
  useEffect(() => {
    if (currentType !== lastType) {
      removeInteractions();
      addInteractions();
    }
  }, [addInteractions, lastType, currentType, removeInteractions]);

  /**
   * Dis/enable the drawInteraction if enabled state changes
   */
  useEffect(() => {
    enabled ? addInteractions() : removeInteractions();
  }, [addInteractions, enabled, removeInteractions]);

  /**
   * When unmounting remove the map interactions
   */
  useEffect(() => {
    return () => {
      removeInteractions();
    };
  }, [removeInteractions]);
};
