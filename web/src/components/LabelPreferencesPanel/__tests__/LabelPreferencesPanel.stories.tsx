import "@/components/LabelPreferencesPanel/LabelPreferencesPanel.scss";

import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick.ts";
import { PanelsContextProvider } from "@linzjs/windows";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel.tsx";
import { handlers } from "@/mocks/mockHandlers.ts";
import { Paths } from "@/Paths.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { findCell, findCellContains, openAndClickMenuOption } from "@/test-utils/storybook-ag-grid-utils.ts";
import { PanelInstanceContextMock, StorybookRouter } from "@/test-utils/storybook-utils.tsx";

const queryClient = new QueryClient();
export default {
  title: "LabelPreferencesPanel",
  component: LabelPreferencesPanel,
  argTypes: {
    transactionId: {
      control: "text",
    },
  },
} as Meta<typeof LabelPreferencesPanel>;

const LabelPreferencesWrapper = ({ transactionId }: { transactionId: string }) => (
  <QueryClientProvider client={queryClient}>
    <FeatureFlagProvider>
      <PanelsContextProvider>
        <StorybookRouter url={generatePath(Paths.labelPreferences, { transactionId })}>
          <Route
            path={Paths.labelPreferences}
            element={
              <PanelInstanceContextMock>
                <LabelPreferencesPanel transactionId={123} />
              </PanelInstanceContextMock>
            }
          />
        </StorybookRouter>
      </PanelsContextProvider>
    </FeatureFlagProvider>
  </QueryClientProvider>
);
type Story = StoryObj<typeof LabelPreferencesWrapper>;

export const Default: Story = {
  render: LabelPreferencesWrapper,
  parameters: {
    msw: {
      handlers: [...handlers],
    },
  },
  args: {
    transactionId: "123",
  },
};

export const NewPlansLabels: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
NewPlansLabels.play = async () => {
  const labelsForNewPlansTab = await screen.findByText("Labels for new plans");
  await userEvent.click(labelsForNewPlansTab);
};

export const RevertLabelStyle: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
RevertLabelStyle.play = async () => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });
  await openAndClickMenuOption("ARCR", "font", "Arial", table);
  const revert = await findCell("ARCR", "revert", table);
  const revertButton = await findQuick(
    {
      classes: "[aria-label=revert]",
    },
    revert,
  );
  await userEvent.click(revertButton);
  await findCellContains("ARCR", "font", "Tahoma", table);
};
