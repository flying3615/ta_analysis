export interface Position {
  x: number;
  y: number;
}

export interface Delta {
  dx: number;
  dy: number;
}

export const atanDegrees360 = (delta: Delta) => {
  const angle = Math.atan2(delta.dy, delta.dx) * (180 / Math.PI);
  return angleDegrees360(angle);
};

export function angleDegrees360<T extends number | null | undefined>(angle: T): T {
  if (!angle) return angle;
  return (angle < 0 ? -(-angle % 360) + 360 : angle % 360) as T;
}

export const deltaFromPolar = (thetaDegrees: number | undefined, r: number | undefined): Delta => {
  const thetaRads = (thetaDegrees ?? 0) * (Math.PI / 180);
  return { dx: (r ?? 0) * Math.cos(thetaRads), dy: (r ?? 0) * Math.sin(thetaRads) };
};

/**
 * Normalize angle to range -90 to 90
 * @param angle
 */
export const normalizeAngle = (angle: number): number => {
  // Normalize angle to range 0 to 360
  angle = (angle + 360) % 360;
  // Adjust angle to range -180 to 180
  if (angle > 180) angle -= 360;
  // Further adjust angle to range -90 to 90
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  // Convert 180 to 0
  return angle === 180 ? 0 : angle;
};

export function midPoint<T extends Delta | Position>(start: T, end: T): T {
  if ("x" in start && "x" in end) {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    } as T;
  }
  if ("dx" in start && "dx" in end) {
    return {
      dx: (start.dx + end.dx) / 2,
      dy: (start.dy + end.dy) / 2,
    } as T;
  }
  throw new Error("Invalid arguments to midPoint ${start} ${end}");
}

export function asCoord(point: Delta | Position): [number, number] {
  if ("x" in point) {
    return [point.x, point.y];
  }
  if ("dx" in point) {
    return [point.dx, point.dy];
  }
  throw new Error("Invalid arguments to asCoord ${point}");
}

export function asPosition(coord: [number, number]): Position {
  return {
    x: coord[0],
    y: coord[1],
  };
}

export function asDelta(coord: [number, number]): Delta {
  return {
    dx: coord[0],
    dy: coord[1],
  };
}

export function addIntoPosition(a: Position, b: Delta | Position): Position {
  const coordB = asCoord(b);
  return asPosition([a.x + coordB[0], a.y + coordB[1]]);
}

export function addIntoDelta(a: Delta, b: Delta | Position): Delta {
  const coordB = asCoord(b);
  return asDelta([a.dx + coordB[0], a.dy + coordB[1]]);
}

export function subtractIntoPosition(a: Position, b: Delta | Position): Position {
  const coordB = asCoord(b);
  return asPosition([a.x - coordB[0], a.y - coordB[1]]);
}

export function subtractIntoDelta(a: Delta | Position, b: Delta | Position): Delta {
  const coordA = asCoord(a);
  const coordB = asCoord(b);
  return asDelta([coordA[0] - coordB[0], coordA[1] - coordB[1]]);
}
