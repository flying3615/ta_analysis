import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const error32027_diagramTooManySides = (maxSides: number): PropsWithChildren<useLuiModalPrefabProps> => ({
  style: { width: "480px", maxWidth: "480px" },
  level: "error",
  title: "Message: 32027",
  children:
    "The diagram cannot be created, as it has too many sides.\n" +
    `Define an area of interest with no more than ${maxSides} sides.`,
});

export const error32027_abuttalTooManyPoints = (maxPoints: number): PropsWithChildren<useLuiModalPrefabProps> => ({
  style: { width: "540px", maxWidth: "540px" },
  level: "error",
  title: "Message: 32057",
  children:
    "The abuttal line cannot be created, as it has too many points.\n" +
    `Define an abuttal line with no more than ${maxPoints} points.`,
});

export const error32021_diagramNoArea: PropsWithChildren<useLuiModalPrefabProps> = {
  style: { width: "480px", maxWidth: "480px" },
  level: "error",
  title: "Message: 32021",
  children: "Unable to create diagram, as the diagram you have defined has no area.",
};

export const error32103_newShapeMustOverlapDiagram: PropsWithChildren<useLuiModalPrefabProps> = {
  style: { width: "480px", maxWidth: "480px" },
  level: "error",
  title: "Message: 32103",
  children: "The new shape must overlap part of the selected diagram.",
};

export const error32104_invalidDiagram: PropsWithChildren<useLuiModalPrefabProps> = {
  style: { width: "480px", maxWidth: "480px" },
  level: "error",
  title: "Message: 32104",
  children: "The altered diagram is invalid and cannot be saved.",
};
