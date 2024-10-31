import {
  addIntoDelta,
  addIntoPosition,
  angleDegrees360,
  asCoord,
  asDelta,
  asPosition,
  atanDegrees360,
  Delta,
  midPoint,
  normalizeAngle,
  Position,
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
    expect(angleDegrees360(30)).toBe(30);
  });

  test("corrects a negative angle", () => {
    expect(angleDegrees360(-60)).toBe(300);
  });

  test("corrects a large angle", () => {
    expect(angleDegrees360(750)).toBe(30);
  });

  test("corrects a large negative angle", () => {
    expect(angleDegrees360(-3610)).toBe(350);
  });

  test("Passes through zero, null, undefined", () => {
    expect(angleDegrees360(0)).toBe(0);
    expect(angleDegrees360(null)).toBeNull();
    expect(angleDegrees360(undefined)).toBeUndefined();
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

describe("normalizeAngle", () => {
  test("normalizes angle to range -90 to 90", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(45)).toBe(45);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(135)).toBe(-45);
    expect(normalizeAngle(180)).toBe(0);
    expect(normalizeAngle(225)).toBe(45);
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(315)).toBe(-45);
    expect(normalizeAngle(360)).toBe(0);
  });

  test("normalizes negative angles to range -90 to 90", () => {
    expect(normalizeAngle(-45)).toBe(-45);
    expect(normalizeAngle(-90)).toBe(-90);
    expect(normalizeAngle(-135)).toBe(45);
    expect(normalizeAngle(-180)).toBe(0);
    expect(normalizeAngle(-225)).toBe(-45);
    expect(normalizeAngle(-270)).toBe(90);
    expect(normalizeAngle(-315)).toBe(45);
    expect(normalizeAngle(-360)).toBe(0);
  });

  test("normalizes large positive angles", () => {
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(540)).toBe(0);
    expect(normalizeAngle(630)).toBe(-90);
  });

  test("normalizes large negative angles", () => {
    expect(normalizeAngle(-450)).toBe(-90);
    expect(normalizeAngle(-540)).toBe(0);
    expect(normalizeAngle(-630)).toBe(-90);
  });
});
