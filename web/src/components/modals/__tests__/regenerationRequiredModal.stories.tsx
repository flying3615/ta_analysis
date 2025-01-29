import "@/components/PlanSheets/PlanSheets.scss";

import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { waitFor } from "@storybook/testing-library";
import React, { useEffect } from "react";

import { regenerationRequiredModal } from "@/components/modals/regenerationRequiredModal";
import { sleep } from "@/test-utils/storybook-utils";

const RegenerationRequiredModalWrapper = () => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  useEffect(() => {
    void showPrefabModal(regenerationRequiredModal());
  }, [showPrefabModal]);
  return <div ref={modalOwnerRef}></div>;
};

export default {
  title: "regenerationRequiredModal",
  component: RegenerationRequiredModalWrapper,
  parameters: {
    chromatic: { delay: 300 },
  },
  viewport: {
    defaultViewport: "tablet",
    defaultOrientation: "portrait",
  },
} as Meta<typeof RegenerationRequiredModalWrapper>;

export const ExpandedRegenerationRequiredModal: StoryObj<typeof RegenerationRequiredModalWrapper> = {
  render: () => {
    return (
      <LuiModalAsyncContextProvider>
        <RegenerationRequiredModalWrapper />
      </LuiModalAsyncContextProvider>
    );
  },
};

ExpandedRegenerationRequiredModal.play = async ({ canvasElement }) => {
  await sleep(2000);
  await waitFor(async () => {
    // eslint-disable-next-line testing-library/no-node-access
    await expect(canvasElement.parentElement?.textContent?.includes("Diagrams out of sync")).toBeTruthy();
    await expect(
      // eslint-disable-next-line testing-library/no-node-access
      canvasElement.parentElement?.textContent?.includes(
        "Survey data has been modified which could affect the plan content. The plan sheets must be regenerated and any changes since the last save will be lost.",
      ),
    ).toBeTruthy();
    // eslint-disable-next-line testing-library/no-node-access
    await expect(canvasElement.parentElement?.textContent?.includes("Regenerate plan sheets")).toBeTruthy();
  });
};
