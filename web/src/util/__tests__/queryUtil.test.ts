import { byId } from "@/util/queryUtil.ts";

describe("queryUtil", () => {
  test("byId", () => {
    expect(byId(10)({ id: 10 })).toBe(true);
    expect(byId(10)({ id: undefined })).toBe(false);
    expect(byId(10)({ id: 11 })).toBe(false);
    expect(byId([10, 11])({ id: 11 })).toBe(true);
    expect(byId([10, 11])({ id: 10 })).toBe(true);
    expect(byId([10, 11])({ id: undefined })).toBe(false);
    expect(byId([])({ id: 10 })).toBe(false);
    expect(byId([])({ id: undefined })).toBe(false);
  });
});
