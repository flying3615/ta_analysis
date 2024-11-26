import {
  addIntoDelta,
  addIntoPosition,
  asCoord,
  asDelta,
  asPosition,
  atanDegrees360,
  clampAngleDegrees360,
  Delta,
  deltaFromPolar,
  midPoint,
  Position,
  rotatePosition,
  subtractIntoDelta,
  subtractIntoPosition,
} from "@/util/positionUtil";

describe("atanDegrees360", () => {
  test("returns a positive angle", () => {
    expect(atanDegrees360({ dx: 1, dy: Math.sqrt(3) })).toBeCloseTo(60);
  });

  test("corrects a negative angle", () => {
    expect(atanDegrees360({ dx: 1, dy: -Math.sqrt(3) })).toBeCloseTo(300);
  });

  test("returns 90 for a vertical line", () => {
    expect(atanDegrees360({ dx: 0, dy: 1 })).toBe(90);
  });

  test("returns zero for a horizontal line", () => {
    expect(atanDegrees360({ dx: 1, dy: 0 })).toBe(0);
  });
});

describe("angleDegrees360", () => {
  test("returns a positive angle", () => {
    expect(clampAngleDegrees360(30)).toBe(30);
  });

  test("corrects a negative angle", () => {
    expect(clampAngleDegrees360(-60)).toBe(300);
  });

  test("corrects a large angle", () => {
    expect(clampAngleDegrees360(750)).toBe(30);
  });

  test("corrects a large negative angle", () => {
    expect(clampAngleDegrees360(-3610)).toBe(350);
  });

  test("Passes through zero, null, undefined", () => {
    expect(clampAngleDegrees360(0)).toBe(0);
    expect(clampAngleDegrees360(null)).toBeNull();
    expect(clampAngleDegrees360(undefined)).toBeUndefined();
  });
});

describe("deltaFromPolar", () => {
  test("Returns a Delta from polar coordinates", () => {
    const delta = deltaFromPolar(30, 1);
    expect(delta.dx).toBeCloseTo(Math.sqrt(3) / 2);
    expect(delta.dy).toBeCloseTo(0.5);
  });
});

describe("midPoint", () => {
  test("Returns mid point of a line between Deltas", () => {
    expect(midPoint({ dx: 4, dy: 8 }, { dx: 10, dy: 20 })).toStrictEqual({ dx: 7, dy: 14 });
  });

  test("Returns mid point of a line between Positions", () => {
    expect(midPoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toStrictEqual({ x: 5, y: 10 });
  });
});

describe("asCoord", () => {
  test("Converts Delta to coord pair", () => {
    expect(asCoord({ dx: 4, dy: 8 })).toStrictEqual([4, 8]);
  });

  test("Converts Position to coord pair", () => {
    expect(asCoord({ x: 4, y: 8 })).toStrictEqual([4, 8]);
  });
});

describe("asPosition", () => {
  test("Converts coord pair to Position", () => {
    expect(asPosition([2, 3])).toStrictEqual({ x: 2, y: 3 } as Position);
  });
});

describe("asDelta", () => {
  test("Converts coord pair to Delta", () => {
    expect(asDelta([2, 3])).toStrictEqual({ dx: 2, dy: 3 } as Delta);
  });
});

describe("addIntoPosition", () => {
  test("Adds two Positions", () => {
    expect(addIntoPosition({ x: 2, y: 1 }, { x: 3, y: 5 })).toStrictEqual({ x: 5, y: 6 });
  });

  test("Adds Position to Delta", () => {
    expect(addIntoPosition({ x: 2, y: 1 }, { dx: 3, dy: 5 })).toStrictEqual({ x: 5, y: 6 });
  });
});

describe("addIntoDelta", () => {
  test("Adds two Deltas", () => {
    expect(addIntoDelta({ dx: 2, dy: 1 }, { dx: 3, dy: 5 })).toStrictEqual({ dx: 5, dy: 6 });
  });

  test("Adds Delta to Position", () => {
    expect(addIntoDelta({ dx: 2, dy: 1 }, { x: 3, y: 5 })).toStrictEqual({ dx: 5, dy: 6 });
  });
});

describe("subtractIntoPosition", () => {
  test("Subtracts two Positions", () => {
    expect(subtractIntoPosition({ x: 8, y: 11 }, { x: 3, y: 5 })).toStrictEqual({ x: 5, y: 6 });
  });

  test("Subtracts Position to Delta", () => {
    expect(subtractIntoPosition({ x: 8, y: 11 }, { dx: 3, dy: 5 })).toStrictEqual({ x: 5, y: 6 });
  });
});

describe("subtractIntoDelta", () => {
  test("Subtracts two Deltas", () => {
    expect(subtractIntoDelta({ dx: 8, dy: 11 }, { dx: 3, dy: 5 })).toStrictEqual({ dx: 5, dy: 6 });
  });

  test("Subtracts Delta to Position", () => {
    expect(subtractIntoDelta({ dx: 8, dy: 11 }, { x: 3, y: 5 })).toStrictEqual({ dx: 5, dy: 6 });
  });
});

describe("rotatePosition", () => {
  test("Rotates by 90 degrees", () => {
    const rp = rotatePosition({ x: 20, y: 10 }, { x: 0, y: 0 }, 90);
    expect(rp.x).toBeCloseTo(-10);
    expect(rp.y).toBeCloseTo(20);
  });

  test("Rotates by 120 degrees", () => {
    const rp = rotatePosition({ x: 20, y: 10 }, { x: 10, y: 0 }, 120);
    expect(rp.x).toBeCloseTo(-3.66);
    expect(rp.y).toBeCloseTo(3.66);
  });

  test("Rotates by 330 degrees", () => {
    const rp = rotatePosition({ x: 10, y: 0 }, { x: 0, y: 0 }, 330);
    expect(rp.x).toBeCloseTo(8.66);
    expect(rp.y).toBeCloseTo(-5);
  });

  test("Rotates by 360 degrees to same value", () => {
    const rp = rotatePosition({ x: 10, y: 10 }, { x: 0, y: 0 }, 360);
    expect(rp.x).toBeCloseTo(10);
    expect(rp.y).toBeCloseTo(10);
  });

  test("Rotates by 90 degrees around an offset", () => {
    const rp = rotatePosition({ x: 8.5, y: -19.5 }, { x: 10, y: -19.75 }, 90);
    expect(rp.x).toBeCloseTo(9.75); // 10 - 0.25
    expect(rp.y).toBeCloseTo(-21.25); // -19.75 - 1.5
  });
});
