import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const error32026_NonPrimaryCannotBeCreated: PropsWithChildren<useLuiModalPrefabProps> = {
  level: "error",
  title: "Message: 32026",
  children:
    "Non Primary user defined diagrams cannot be created, as\n" +
    "there is no boundary information included in this survey.",
};

export const error32027_diagramTooManySides = (maxSides: number): PropsWithChildren<useLuiModalPrefabProps> => ({
  level: "error",
  title: "Message: 32027",
  children:
    "The diagram cannot be created, as it has too many sides.\n" +
    `Define an area of interest with no more than ${maxSides} sides.`,
});

export const error32021_diagramNoArea: PropsWithChildren<useLuiModalPrefabProps> = {
  level: "error",
  title: "Message: 32021",
  children:
    "Unable to create diagram, as the diagram you have defined has no area. Diagram width and height must be greater than zero.",
};

export const error32103_newShapeMustOverlapDiagram: PropsWithChildren<useLuiModalPrefabProps> = {
  level: "error",
  title: "Message: 32103",
  children: "The new shape must overlap part of the selected diagram.",
};

export const error32104_invalidDiagram: PropsWithChildren<useLuiModalPrefabProps> = {
  level: "error",
  title: "Message: 32104",
  children: "The altered diagram is invalid and cannot be saved.",
};
