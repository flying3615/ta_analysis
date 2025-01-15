import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { waitFor } from "@storybook/testing-library";
import { useEffect } from "react";

import { asyncTaskFailedErrorModal } from "@/components/modals/asyncTaskFailedErrorModal";
import { sleep } from "@/test-utils/storybook-utils";

const TestModalTemplate = (props: { exception?: string; exceptionMessage?: string }) => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    void showPrefabModal(asyncTaskFailedErrorModal("Save failed", props.exception, props.exceptionMessage));
  }, [props.exception, props.exceptionMessage, showPrefabModal]);

  return <div ref={modalOwnerRef}>My page</div>;
};

export default {
  title: "asyncTaskFailedErrorModal",
  component: TestModalTemplate,
  viewport: {
    defaultViewport: "tablet",
    defaultOrientation: "portrait",
  },
  parameters: {
    chromatic: { delay: 300 },
  },
} as Meta<typeof TestModalTemplate>;

type Story = StoryObj<typeof TestModalTemplate>;

export const WithoutErrorInfo: Story = {
  render: () => (
    <LuiModalAsyncContextProvider>
      <TestModalTemplate />
    </LuiModalAsyncContextProvider>
  ),
};

WithoutErrorInfo.play = async ({ canvasElement }) => {
  await sleep(2000);
  await waitFor(
    async () => {
      // eslint-disable-next-line testing-library/no-node-access
      await expect(canvasElement.parentElement?.textContent?.includes("Save failed")).toBeTruthy();
      // eslint-disable-next-line testing-library/no-node-access
      await expect(canvasElement.parentElement?.textContent?.includes("Detailed error information")).toBeFalsy();
    },
    { timeout: 30000 },
  );
  await sleep(2000);
};

export const WithErrorInfo: Story = {
  render: () => (
    <LuiModalAsyncContextProvider>
      <TestModalTemplate exception="SomeException" exceptionMessage="Something bad happened" />
    </LuiModalAsyncContextProvider>
  ),
};

WithErrorInfo.play = async ({ canvasElement }) => {
  await sleep(2000);
  await waitFor(
    async () => {
      // eslint-disable-next-line testing-library/no-node-access
      await expect(canvasElement.parentElement?.textContent?.includes("Save failed")).toBeTruthy();
      // eslint-disable-next-line testing-library/no-node-access
      await expect(canvasElement.parentElement?.textContent?.includes("Detailed error information")).toBeTruthy();
    },
    { timeout: 30000 },
  );
  await sleep(2000);
};
