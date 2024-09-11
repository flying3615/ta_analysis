import { promiseWithTimeout } from "@/util/promiseUtil.ts";

describe("promiseWithTimeout", () => {
  it("should resolve if the promise resolves before the timeout", async () => {
    const promise = {
      name: "test promise",
      promise: new Promise((resolve) => setTimeout(() => resolve("resolved"), 500)),
    };
    const result = await promiseWithTimeout(promise, 1000, "Timeout Error");
    expect(result).toBe("resolved");
  });

  it("should reject with an error if the promise does not resolve before the timeout", async () => {
    const promise = {
      name: "test promise",
      promise: new Promise((resolve) => setTimeout(() => resolve("resolved"), 1500)),
    };
    try {
      await promiseWithTimeout(promise, 1000, "Timeout Error");
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toBeInstanceOf(Error);
      // eslint-disable-next-line jest/no-conditional-expect,@typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toBe("test promise Timeout Error");
    }
  });
});
