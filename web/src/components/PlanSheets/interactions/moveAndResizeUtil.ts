import { BoundingBox12 } from "cytoscape";

export interface AspectRatio {
  h: number;
  w: number;
}

export interface BoundingBox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export const Resize = {
  E: "resize-e",
  N: "resize-n",
  NE: "resize-ne",
  NW: "resize-nw",
  S: "resize-s",
  SE: "resize-se",
  SW: "resize-sw",
  W: "resize-w",
} as const;

export type ResizeControl = (typeof Resize)[keyof typeof Resize];

export interface ResizeLimits {
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minWidth?: number;
}

/**
 * Calculate maximum resize within limits from control point.
 *
 * @param extent the extent being resized.
 * @param control how extent is being resized.
 * @param bounds the maximum extents.
 * @param limits any initial contraints.
 * @returns
 *    maximum width/height that fit within bounds,
 *    if resized from control anchor point.
 *
 * @see resizeExtent which uses shared control anchors.
 */
export function getResizeLimits(
  extent: BoundingBox,
  control: ResizeControl,
  bounds: BoundingBox[],
  limits: ResizeLimits = {},
): ResizeLimits {
  const { x1, x2, y1, y2 } = extent;
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;

  let maxHeight = limits.maxHeight ?? Number.POSITIVE_INFINITY;
  let maxWidth = limits.maxWidth ?? Number.POSITIVE_INFINITY;

  bounds.forEach((bound) => {
    const { x1: bx1, x2: bx2, y1: by1, y2: by2 } = bound;

    // corners anchor to opposite corner
    if (control === Resize.NW) {
      maxHeight = Math.min(maxHeight, y2 - by1);
      maxWidth = Math.min(maxWidth, x2 - bx1);
    } else if (control === Resize.NE) {
      maxHeight = Math.min(maxHeight, y2 - by1);
      maxWidth = Math.min(maxWidth, bx2 - x1);
    } else if (control === Resize.SE) {
      maxHeight = Math.min(maxHeight, by2 - y1);
      maxWidth = Math.min(maxWidth, bx2 - x1);
    } else if (control === Resize.SW) {
      maxHeight = Math.min(maxHeight, by2 - y1);
      maxWidth = Math.min(maxWidth, x2 - bx1);
    } else {
      // sides anchor to center of opposite side
      if (control === Resize.E) {
        maxHeight = Math.min(maxHeight, (centerY - by1) * 2, (by2 - centerY) * 2);
        maxWidth = Math.min(maxWidth, bx2 - x1);
      } else if (control === Resize.W) {
        maxHeight = Math.min(maxHeight, (centerY - by1) * 2, (by2 - centerY) * 2);
        maxWidth = Math.min(maxWidth, x2 - bx1);
      } else if (control === Resize.N) {
        maxHeight = Math.min(maxHeight, y2 - by1);
        maxWidth = Math.min(maxWidth, (centerX - bx1) * 2, (bx2 - centerX) * 2);
      } else if (control === Resize.S) {
        maxHeight = Math.min(maxHeight, by2 - y1);
        maxWidth = Math.min(maxWidth, (centerX - bx1) * 2, (bx2 - centerX) * 2);
      }
    }
  });

  return { ...limits, maxHeight, maxWidth };
}

export function isResizeControl(id: string): id is ResizeControl {
  const values = Object.values(Resize) as string[];
  return values.includes(id);
}

/**
 * Move extent within limits.
 *
 * @param extent the extent being move.
 * @param dx requested change in x.
 * @param dy requested change in y.
 * @param limits optional area limits.
 * @returns
 *    moved extent, within provided limits.
 */
export function moveExtent(extent: BoundingBox, dx: number, dy: number, limits?: BoundingBox): BoundingBox {
  let moved = { x1: extent.x1 + dx, x2: extent.x2 + dx, y1: extent.y1 + dy, y2: extent.y2 + dy };

  if (limits) {
    if (moved.x1 < limits.x1) {
      dx = limits.x1 - moved.x1;
      moved = { ...moved, x1: moved.x1 + dx, x2: moved.x2 + dx };
    } else if (moved.x2 > limits.x2) {
      dx = moved.x2 - limits.x2;
      moved = { ...moved, x1: moved.x1 - dx, x2: moved.x2 - dx };
    }

    if (moved.y1 < limits.y1) {
      dy = limits.y1 - moved.y1;
      moved = { ...moved, y1: moved.y1 + dy, y2: moved.y2 + dy };
    } else if (moved.y2 > limits.y2) {
      dy = moved.y2 - limits.y2;
      moved = { ...moved, y1: moved.y1 - dy, y2: moved.y2 - dy };
    }
  }

  return moved;
}

/**
 * Resize extent preserving aspect ratio within limits.
 *
 * @param extent the extent being resized.
 * @param control how extent is being resized.
 * @param dx requested change in x.
 * @param dy requested change in y.
 * @param limits optional size limits.
 * @returns
 *    resized extent, within provided limits.
 *
 * @see getResizeLimits which uses shared control anchors.
 */
export function resizeExtent(
  extent: BoundingBox,
  control: ResizeControl,
  dx: number,
  dy: number,
  limits?: ResizeLimits,
): BoundingBox {
  const { x1, x2, y1, y2 } = extent;
  const { w: scaledW, h: scaledH } = scaleExtent(extent, control, dx, dy, limits);

  let resized = { x1, x2, y1, y2 };
  // corners anchor to opposite corner
  if (control === Resize.NW) {
    resized = { x1: x2 - scaledW, x2, y1: y2 - scaledH, y2 };
  } else if (control === Resize.NE) {
    resized = { x1, x2: x1 + scaledW, y1: y2 - scaledH, y2 };
  } else if (control === Resize.SE) {
    resized = { x1, x2: x1 + scaledW, y1, y2: y1 + scaledH };
  } else if (control === Resize.SW) {
    resized = { x1: x2 - scaledW, x2, y1, y2: y1 + scaledH };
  } else {
    // sides anchor to center of opposite side
    const halfH = scaledH / 2;
    const halfW = scaledW / 2;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    if (control === Resize.E) {
      resized = { x1, x2: x1 + scaledW, y1: centerY + halfH, y2: centerY - halfH };
    } else if (control === Resize.W) {
      resized = { x1: x2 - scaledW, x2, y1: centerY + halfH, y2: centerY - halfH };
    } else if (control === Resize.N) {
      resized = { x1: centerX - halfW, x2: centerX + halfW, y1: y2 - scaledH, y2 };
    } else if (control === Resize.S) {
      resized = { x1: centerX - halfW, x2: centerX + halfW, y1, y2: y1 + scaledH };
    }
  }

  return {
    x1: Math.min(resized.x1, resized.x2),
    x2: Math.max(resized.x1, resized.x2),
    y1: Math.min(resized.y1, resized.y2),
    y2: Math.max(resized.y1, resized.y2),
  };
}

/**
 * Scale extent preserving aspect ratio within limits.
 *
 * @param extent the extent being resized.
 * @param control how extent is being resized.
 * @param dx requested change in x.
 * @param dy requested change in y.
 * @param limits optional size limits.
 * @returns
 *    updated width and height.
 */
export function scaleExtent(
  extent: BoundingBox,
  control: ResizeControl,
  dx: number,
  dy: number,
  limits: ResizeLimits = {},
): AspectRatio {
  const {
    minHeight = Number.NEGATIVE_INFINITY,
    maxHeight = Number.POSITIVE_INFINITY,
    maxWidth = Number.POSITIVE_INFINITY,
    minWidth = Number.NEGATIVE_INFINITY,
  } = limits;
  const { x1, x2, y1, y2 } = extent;
  const h = y2 - y1;
  const w = x2 - x1;

  // constrain proportions
  let xScale = (w + dx) / w;
  if (control === Resize.NW || control === Resize.SW || control === Resize.W) {
    xScale = (w - dx) / w; // +x reduces size
  }
  let yScale = (h + dy) / h;
  if (control === Resize.N || control === Resize.NE || control === Resize.NW) {
    yScale = (h - dy) / h; // +y reduces size
  }
  let scale = Math.max(xScale, yScale);
  if (control === Resize.N || control === Resize.S) {
    scale = yScale; // only y moves
  } else if (control === Resize.E || control === Resize.W) {
    scale = xScale; // only x moves
  }
  let scaledH = h * scale;
  let scaledW = w * scale;

  // limit size
  if (scaledH < minHeight || scaledH > maxHeight) {
    scaledH = Math.max(minHeight, Math.min(scaledH, maxHeight));
    scaledW = (w * scaledH) / h;
  }
  if (scaledW < minWidth || scaledW > maxWidth) {
    scaledW = Math.max(minWidth, Math.min(scaledW, maxWidth));
    scaledH = (h * scaledW) / w;
  }

  return { h: scaledH, w: scaledW };
}

export const calculateRelativeScale = (original: BoundingBox12, resized: BoundingBox12) =>
  // scale change same in either axis, since constrained
  +((original.x2 - original.x1) / (resized.x2 - resized.x1)).toFixed(5);
