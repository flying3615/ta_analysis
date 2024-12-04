// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, screen, waitFor, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cloneDeep } from "lodash-es";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import LandingPage from "@/components/LandingPage/LandingPage";
import CompileImagesViewer from "@/components/PlanSheets/__tests__/CompileImagesViewer";
import { Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { clearLayoutAutoSave } from "@/hooks/usePlanAutoRecover";
import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { ModalStoryWrapper, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "CompilePlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const transactionId = 123;
const queryClient = new QueryClient();

const PlanSheetsTemplate = (transactionId: string) => {
  return (
    <LuiModalAsyncContextProvider>
      <MockUserContextProvider
        user={singleFirmUserExtsurv1}
        initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}
      >
        <FeatureFlagProvider>
          <QueryClientProvider client={queryClient}>
            <Provider store={cloneDeep(store)}>
              <ModalStoryWrapper>
                <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: transactionId })}>
                  <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
                  <Route path={Paths.defineDiagrams} element={<span>Define Diagrams Dummy Page</span>} />
                  <Route path={Paths.root} element={<LandingPage />} />
                </StorybookRouter>
              </ModalStoryWrapper>
            </Provider>
          </QueryClientProvider>
        </FeatureFlagProvider>
      </MockUserContextProvider>
    </LuiModalAsyncContextProvider>
  );
};

const CompileIt = (fileName: string): Story => ({
  beforeEach: async () => {
    indexedDB.deleteDatabase("compileImages");
    await clearLayoutAutoSave(transactionId);
  },
  render: () => (
    <CompileImagesViewer imageFilename={fileName} planSheetsTemplate={PlanSheetsTemplate(transactionId.toString())} />
  ),
  parameters: {
    chromatic: {
      viewports: [800],
    },
    viewport: {
      viewports: 800,
      defaultViewport: 800,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.click(await canvas.findByTitle("View labels"));
    fireEvent.click(await canvas.findByText("Parcel appellations")); // uncheck parcel appellations
    fireEvent.click(canvas.getByRole("button", { name: "OK" })); // save the changes
    await sleep(500);
    fireEvent.click(await canvas.findByText("Compile plan(s)"));
    const modal = await screen.findByRole("dialog");
    const modalText = /Complete Plan Generation/i;
    await expect(modal.textContent).toMatch(modalText);
    fireEvent.click(await waitFor(async () => await screen.findByText("Yes")));

    await waitFor(
      async () => {
        await expect(canvas.getByText("Compile plan(s)")).toBeInTheDocument();
      },
      { timeout: 18000 },
    );
    fireEvent.click(await screen.findByText("Refresh it"));
    await waitFor(
      async () => {
        await expect(canvas.getAllByText(`Image name: `, { exact: false })[0]).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
});

export const CompiledImageDSPT = CompileIt("DSPT-1.jpg");
export const CompiledImageDTPS = CompileIt("DTPS-1.jpg");
export const ViewAllCompiledImages: Story = {
  parameters: {
    chromatic: {
      disableSnapshot: true, // TODO Disable snapshot for this story
    },
  },
  ...CompileIt("all"),
};
