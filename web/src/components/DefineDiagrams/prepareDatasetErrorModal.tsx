import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";
import { PrepareDatasetError } from "@/queries/prepareDataset";

export const prepareDatasetErrorModal = (
  prepareDatasetError: PrepareDatasetError,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title: "Error preparing dataset",
  children: (
    <>
      {prepareDatasetError.statusCode && <>{prepareDatasetError.statusCode}:</>} {prepareDatasetError.message}
    </>
  ),
  buttons: [{ title: "Dismiss", value: true }],
});
