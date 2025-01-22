import { exceptionMessage, prefixException } from "@/hooks/useActionToast";

describe("useActionToast", () => {
  test("exceptionMessage", () => {
    expect(exceptionMessage(null)).toBe("unexpected error");
    expect(exceptionMessage(undefined)).toBe("unexpected error");
    expect(exceptionMessage(Error("Error 123: foo"))).toBe("Error 123: foo");
    expect(exceptionMessage(Error("Response returned an error code"))).toBe("unexpected error");
    expect(exceptionMessage(Error("Hello"))).toBe("Hello");
    expect(exceptionMessage(Error(""))).toBe("unexpected error");
    expect(exceptionMessage({})).toBe("unexpected error");
  });

  test("prefixException", () => {
    expect(prefixException(Error("Error 123: foo"), "prefix")).toBe("Error 123: foo");
    expect(prefixException(Error("Hello"), "prefix")).toBe("prefix Hello");
    expect(prefixException(Error("Response returned an error code"), "prefix")).toBe("prefix unexpected error");
  });
});
