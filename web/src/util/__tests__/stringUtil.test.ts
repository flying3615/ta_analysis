import { s } from "@/util/stringUtil.ts";

describe("Pluralise", () => {
  test("s", () => {
    expect(s([])).toBe("");
    expect(s([])).toBe("");
    expect(s([1])).toBe("");
    expect(s([1, 2])).toBe("s");
  });
});
