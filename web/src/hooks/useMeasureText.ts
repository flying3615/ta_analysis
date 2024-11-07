import { max, sum } from "lodash-es";
import { useEffect, useState } from "react";

import { Delta } from "@/util/positionUtil";

const PIXELS_PER_CM = 37.79;

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

  const measureTextCm = (text: string, font: string = "Tahoma", fontSize: number = 12): Delta => {
    const lines = text.split("\n");

    if (measuringContext) {
      measuringContext.font = `${fontSize}px ${font}`; // order matters here
      const lineSizes = lines.map((l: string) => measuringContext.measureText(l));

      const width = max<number>(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0;
      const height = sum(lineSizes.map((ls: TextMetrics) => ls.fontBoundingBoxAscent + ls.fontBoundingBoxDescent));
      return { dx: width / PIXELS_PER_CM, dy: height / PIXELS_PER_CM };
    }

    // Fallback if we couldn't get the canvas context
    console.warn("Warning: couldn't get canvas context for measuring text size");
    const height = lines.length / PIXELS_PER_CM;
    const width = (max(lines.map((l: string) => l.length)) ?? 0) / PIXELS_PER_CM;
    return { dx: width, dy: height };
  };

  return measureTextCm;
};
