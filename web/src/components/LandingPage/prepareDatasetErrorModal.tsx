import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";
import { PostDiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";

export const prepareDatasetErrorModal = (
  prepareDatasetError: PostDiagramsResponseDTO,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title: "Error preparing dataset",
  children: (
    <>
      {prepareDatasetError.statusCode && <>{prepareDatasetError.statusCode}:</>} {prepareDatasetError.message}
    </>
  ),
  buttons: [{ title: "Continue", value: true }],
});
