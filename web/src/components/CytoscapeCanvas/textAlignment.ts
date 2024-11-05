import cytoscape, { NodeSingular } from "cytoscape";
import { memoize } from "lodash-es";

import { getStyleData, LABEL_PADDING_PX } from "@/components/CytoscapeCanvas/styleNodeMethods";

export interface TextAlignment {
  horizontal: "left" | "center" | "right";
  justify: "left" | "center" | "right";
  vertical: "bottom" | "center" | "top";
}

const getTextAlign = (textAlignment?: string): TextAlignment | undefined => {
  if (!textAlignment) {
    return;
  }
  let horizontal: TextAlignment["horizontal"] = "left";
  let justify: TextAlignment["justify"] = "left";
  let vertical: TextAlignment["vertical"] = "center";

  const [textAlign, textJustify] = textAlignment.split(",", 2);
  if (textAlign?.endsWith("Center")) {
    horizontal = "center";
  } else if (textAlign?.endsWith("Right")) {
    horizontal = "right";
  }

  if (textJustify?.endsWith("Center")) {
    justify = "center";
  } else if (textJustify?.endsWith("Right")) {
    justify = "right";
  }

  if (textAlign?.startsWith("bottom")) {
    vertical = "bottom";
  } else if (textAlign?.startsWith("top")) {
    vertical = "top";
  }

  return { horizontal, justify, vertical };
};

export const memoizedTextAlign = memoize(getTextAlign);
const elementTextAlign = (ele: NodeSingular): TextAlignment | undefined =>
  memoizedTextAlign(getStyleData(ele).textAlignment);

export const textHAlign = (ele: cytoscape.NodeSingular): TextAlignment["horizontal"] =>
  (
    ({
      left: "right",
      center: "center",
      right: "left",
    }) as Record<TextAlignment["horizontal"], TextAlignment["horizontal"]>
  )[elementTextAlign(ele)?.horizontal ?? "left"]; // so default is "right" !?;

const signumsForHorizontal = {
  left: 1,
  center: 0,
  right: -1,
};

const signumHorizontal = (ele: cytoscape.NodeSingular): number =>
  signumsForHorizontal[elementTextAlign(ele)?.horizontal ?? "right"];

// Cytoscape pads our labels inside the border
// but we also need to adjust the label location relative to the node
export const paddingOffsetHorizontal = (ele: cytoscape.NodeSingular) => signumHorizontal(ele) * LABEL_PADDING_PX;

const signumsForVertical = {
  bottom: 1,
  center: 0,
  top: -1,
};
const elementSignumVertical = (ele: cytoscape.NodeSingular): number =>
  signumsForVertical[elementTextAlign(ele)?.vertical ?? "center"];

export const textAlignSignumVertical = (textAlign: string | undefined): number =>
  signumsForVertical[getTextAlign(textAlign)?.vertical ?? "center"];

export const textAlignSignumHorizontal = (textAlign: string | undefined): number =>
  signumsForHorizontal[getTextAlign(textAlign)?.horizontal ?? "center"];

export const paddingOffsetVertical = (ele: cytoscape.NodeSingular) =>
  ((elementSignumVertical(ele) + 1) * LABEL_PADDING_PX) / 2;

export const textVAlign = (ele: cytoscape.NodeSingular): TextAlignment["vertical"] =>
  (
    ({
      bottom: "top",
      center: "center",
      top: "bottom",
    }) as Record<TextAlignment["vertical"], TextAlignment["vertical"]>
  )[elementTextAlign(ele)?.vertical ?? "center"];
