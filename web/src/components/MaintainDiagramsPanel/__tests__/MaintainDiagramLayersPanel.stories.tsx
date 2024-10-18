import "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel.scss";

import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick.ts";
import { PanelsContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { MaintainDiagramsPanel } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel.tsx";
import { handlers } from "@/mocks/mockHandlers.ts";
import { Paths } from "@/Paths.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import {
  clickLayersSelectButton,
  findCellContains,
  getLayerSelectedState,
} from "@/test-utils/storybook-ag-grid-utils.ts";
import { PanelInstanceContextMock, sleep, StorybookRouter } from "@/test-utils/storybook-utils.tsx";

const queryClient = new QueryClient();
export default {
  title: "MaintainDiagramLayersPanel",
  component: MaintainDiagramsPanel,
  argTypes: {
    transactionId: {
      control: "text",
    },
  },
} as Meta<typeof MaintainDiagramsPanel>;

const MaintainDiagramsWrapper = ({ transactionId }: { transactionId: string }) => (
  <QueryClientProvider client={queryClient}>
    <FeatureFlagProvider>
      <PanelsContextProvider>
        <StorybookRouter url={generatePath(Paths.maintainDiagramLayers, { transactionId })}>
          <Route
            path={Paths.maintainDiagramLayers}
            element={
              <PanelInstanceContextMock>
                <MaintainDiagramsPanel transactionId={123} />
              </PanelInstanceContextMock>
            }
          />
        </StorybookRouter>
      </PanelsContextProvider>
    </FeatureFlagProvider>
  </QueryClientProvider>
);
type Story = StoryObj<typeof MaintainDiagramsWrapper>;

export const Default: Story = {
  render: MaintainDiagramsWrapper,
  parameters: {
    msw: {
      handlers: [...handlers],
    },
  },
  args: {
    transactionId: "123",
  },
};

export const RequiredLayersAreAutomaticallyEnabled: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
RequiredLayersAreAutomaticallyEnabled.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {
    await sleep(1000);
  });
  await step("WHEN I select a layer that has a required layer", async () => {
    await clickLayersSelectButton("51", table);
  });
  await step("THEN the required layer is automatically selected", async () => {
    await sleep(1000);
    await expect(await getLayerSelectedState("50", table)).toEqual("selected");
  });
  await step("AND WHEN I unselect that required layer", async () => {
    await clickLayersSelectButton("50", table);
  });
  await step("THEN both layers are unselected", async () => {
    await sleep(1000);
    await expect(await getLayerSelectedState("50", table)).toEqual("not selected");
    await expect(await getLayerSelectedState("51", table)).toEqual("not selected");
  });
};

export const ExistingParcelsSelectionContainsBoundaryLinesOption: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
ExistingParcelsSelectionContainsBoundaryLinesOption.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {
    await sleep(1000);
  });
  await step("WHEN I click the select button for the Existing Parcels layer", async () => {
    await clickLayersSelectButton("23", table);
  });
  await step("THEN the Boundary Lines option is displayed", async () => {
    await findCellContains("23", "selected", /Boundary Lines ON/);
  });
};

export const MaintainIndividualUserDefinedDiagramsDefault: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
MaintainIndividualUserDefinedDiagramsDefault.play = async () => {
  const maintainIndividualUserDefinedDiagramsTab = await screen.findByText("Maintain individual user defined diagrams");
  await userEvent.click(maintainIndividualUserDefinedDiagramsTab);
};
