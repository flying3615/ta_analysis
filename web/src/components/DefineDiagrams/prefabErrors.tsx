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
