import { textJustification } from "@/components/CytoscapeCanvas/styleNodeMethods";
import {
  memoizedTextAlign,
  paddingOffsetHorizontal,
  paddingOffsetVertical,
  textAlignSignumHorizontal,
  textHAlign,
  textVAlign,
} from "@/components/CytoscapeCanvas/textAlignment";
import { nodeSingular } from "@/test-utils/cytoscape-utils";

describe("textAlignment", () => {
  const defaultTestNode = {
    textAlignment: "topLeft,textCenter",
  };
  const testEle = nodeSingular(defaultTestNode);

  test("textHAlign returns reversed horizontal alignment", () => {
    expect(textHAlign(testEle)).toBe("right");
  });
  test("textVAlign returns reversed vertical alignment", () => {
    expect(textVAlign(testEle)).toBe("bottom");
  });
  test("textJustification returns justification", () => {
    expect(textJustification(testEle)).toBe("center");
  });

  test("memoizedTextAlign parses alignment string to components", () => {
    expect(memoizedTextAlign("topLeft,textCenter")).toEqual({
      horizontal: "left",
      justify: "center",
      vertical: "top",
    });
    expect(memoizedTextAlign("topLeft")).toEqual({
      horizontal: "left",
      justify: "left",
      vertical: "top",
    });
    expect(memoizedTextAlign("bottomRight")).toEqual({
      horizontal: "right",
      justify: "left",
      vertical: "bottom",
    });
  });

  test("textHAlign extracts reversed horizontal alignment from element", () => {
    expect(textHAlign(testEle)).toBe("right");

    const centerTestEle = nodeSingular({ textAlignment: "centerCenter" });
    expect(textHAlign(centerTestEle)).toBe("center");
  });

  test("textVAlign extracts reversed vertical alignment from element", () => {
    expect(textVAlign(testEle)).toBe("bottom");

    const topTestEle = nodeSingular({ textAlignment: "bottomCenter" });
    expect(textVAlign(topTestEle)).toBe("top");
  });

  test("paddingOffsetHorizontal computes padding offset for horizontal alignment", () => {
    expect(paddingOffsetHorizontal(testEle)).toBe(4);
  });

  test("paddingOffsetVertical computes padding offset for vertical alignment", () => {
    expect(paddingOffsetVertical(testEle)).toBe(0);
  });

  test("textAlignSignumHorizontal returns correct signed value for increasing y", () => {
    expect(textAlignSignumHorizontal("topLeft,textLeft")).toBe(1);
  });

  test("textAlignSignumVertical returns correct signed value for increasing y", () => {
    expect(textAlignSignumHorizontal("topLeft,textLeft")).toBe(1);
  });
});
