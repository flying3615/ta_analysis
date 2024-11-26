import { max, sum } from "lodash-es";
import { useEffect, useState } from "react";

import { CSS_PIXELS_PER_CM } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { measureTextFallback } from "@/util/labelUtil";
import { Delta } from "@/util/positionUtil";

export const useMeasureText = () => {
  const [measuringContext, setMeasuringContext] = useState<OffscreenCanvasRenderingContext2D>();

  useEffect(() => {
    if (typeof OffscreenCanvas === "undefined") return;

    const canvas = new OffscreenCanvas(400, 300);
    const context = canvas.getContext("2d");
    if (context) {
      setMeasuringContext(context);
    }
  }, []);

  return (text: string, font: string = "Tahoma", fontSize: number = 12): Delta => {
    const lines = text.split("\n");

    if (measuringContext) {
      measuringContext.font = `${fontSize}px ${font}`; // order matters here
      const lineSizes = lines.map((l: string) => measuringContext.measureText(l));

      const width = max<number>(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0;
      const height = sum(lineSizes.map((ls: TextMetrics) => ls.fontBoundingBoxAscent + ls.fontBoundingBoxDescent));
      return { dx: width / CSS_PIXELS_PER_CM, dy: height / CSS_PIXELS_PER_CM };
    }

    // Fallback if we couldn't get the canvas context
    console.warn("Warning: couldn't get canvas context for measuring text size");
    return measureTextFallback(lines, fontSize);
  };
};
