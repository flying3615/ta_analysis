// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, screen, waitFor, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cloneDeep } from "lodash-es";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import CompileImagesViewer from "@/components/PlanSheets/__tests__/CompileImagesViewer";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { ModalStoryWrapper, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "CompilePlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

export type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LuiModalAsyncContextProvider>
        <FeatureFlagProvider>
          <Provider store={cloneDeep(store)}>
            <ModalStoryWrapper>
              <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
                <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
                <Route path={Paths.defineDiagrams} element={<span>Define Diagrams Dummy Page</span>} />
              </StorybookRouter>
            </ModalStoryWrapper>
          </Provider>
        </FeatureFlagProvider>
      </LuiModalAsyncContextProvider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

// Chromatic will execute the test in the order defined in the storybook
export const CompilePlans: Story = {
  parameters: {
    chromatic: { runBefore: ["CompiledImageDSPT", "CompiledImageDTPS"] },
  },
  ...Default,
  play: async ({ canvasElement }) => {
    indexedDB.deleteDatabase("compileImages");
    const canvas = within(canvasElement);
    fireEvent.click(await canvas.findByText("Compile plan(s)"));
    const modal = await screen.findByRole("dialog");
    const modalText = /Complete Plan Generation/i;
    await expect(modal.textContent).toMatch(modalText);
    await sleep(500);
    try {
      fireEvent.click(await screen.findByText("Yes"));
    } catch (e) {
      // First run will not have the "Yes" button
    }

    await waitFor(
      async () => {
        await expect(canvas.getByText("Compile plan(s)")).toBeInTheDocument();
      },
      { timeout: 15000 },
    );
  },
};

// We dont need to run this test in chromatic
export const ViewAllCompiledImages: Story = {
  render: () => <CompileImagesViewer imageIndex="all" />,
  parameters: {
    chromatic: { disable: true },
  },
};

export const CompiledImageDSPT: Story = {
  parameters: {
    chromatic: { delay: 3000 },
  },
  render: () => <CompileImagesViewer imageIndex={0} />,
};

export const CompiledImageDTPS: Story = {
  parameters: {
    chromatic: { delay: 3000 },
  },
  render: () => <CompileImagesViewer imageIndex={2} />,
};
