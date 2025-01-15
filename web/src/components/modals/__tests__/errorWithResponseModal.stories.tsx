import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { waitFor } from "@storybook/testing-library";
import { useEffect } from "react";

import { errorWithResponseModal } from "@/components/modals/errorWithResponseModal";
import { sleep } from "@/test-utils/storybook-utils";

const TestModalTemplate = (_: { defaultToOpen?: boolean }) => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    // We want the error message to be the same every time so
    // Chromatic doesn't fail
    // const journeyId = "12345678-302e-4896-8365-8cfb750af3ee";
    // Cookies.set("Landonline-Journey-Id", journeyId, {
    //   expires: 1,
    //   secure: true,
    //   sameSite: "strict",
    // });

    void showPrefabModal(
      errorWithResponseModal({
        name: "Test error",
        message: "Test error",
        stack: "Error: Test error\nat [stack trace]",
        timestamp: new Date(Date.parse("2024-02-02")),
        response: {
          status: 423,
        },
      }),
    );
  }, [showPrefabModal]);

  return <div ref={modalOwnerRef}>My page</div>;
};

export default {
  title: "errorWithResponseModal",
  component: TestModalTemplate,
  parameters: {
    chromatic: { delay: 300 },
  },
  viewport: {
    defaultViewport: "tablet",
    defaultOrientation: "portrait",
  },
} as Meta<typeof TestModalTemplate>;

type Story = StoryObj<typeof TestModalTemplate>;

export const Default: Story = {
  render: () => (
    <LuiModalAsyncContextProvider>
      <TestModalTemplate />
    </LuiModalAsyncContextProvider>
  ),
};
Default.play = async ({ canvasElement }) => {
  await sleep(2000);
  await waitFor(async () => {
    // eslint-disable-next-line testing-library/no-node-access
    await expect(canvasElement.parentElement?.textContent?.includes("Test error")).toBeTruthy();
  });
  await sleep(2000);
};
