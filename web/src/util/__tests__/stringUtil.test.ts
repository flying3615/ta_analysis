import { s, wrapText } from "@/util/stringUtil";

describe("Pluralise", () => {
  test("s", () => {
    expect(s([])).toBe("");
    expect(s([])).toBe("");
    expect(s([1])).toBe("");
    expect(s([1, 2])).toBe("s");
  });
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.OffscreenCanvas = class {
  constructor() {
    return {
      getContext: jest.fn().mockReturnValue({
        font: "",
        measureText: jest.fn().mockReturnValue({ width: 100 }), // mock each word width is 100px
      }),
    };
  }
};
describe("wrapText", () => {
  test("should wrap and truncate text correctly", () => {
    const text = "This is a long sentence that should be wrapped by each word.";
    const maxWidth = 10; // each word width is 100px, so 10px can fit 1 word
    const maxHeight = 100;
    const lineHeightFactor = 1.2;
    const fontSize = 16;
    const fontFamily = "Arial";

    const result = wrapText(text, maxWidth, maxHeight, lineHeightFactor, fontSize, fontFamily);

    const expectedResult = "This \nis \na \nlong \n...";

    expect(result).toBe(expectedResult);
  });
});
