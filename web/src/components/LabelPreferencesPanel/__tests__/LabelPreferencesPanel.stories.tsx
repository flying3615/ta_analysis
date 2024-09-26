import "@/components/LabelPreferencesPanel/LabelPreferencesPanel.scss";

import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick.ts";
import { PanelInstanceContext, PanelsContextProvider } from "@linzjs/windows";
import { PanelInstanceContextType } from "@linzjs/windows/dist/panel/PanelInstanceContext.ts";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel.tsx";
import { handlers } from "@/mocks/mockHandlers.ts";
import { Paths } from "@/Paths.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { findCell, findCellContains, openAndClickMenuOption } from "@/test-utils/storybook-ag-grid-utils.ts";
import { StorybookRouter } from "@/test-utils/storybook-utils.tsx";

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

const PanelInstanceContextMock = ({ children, ...props }: PropsWithChildren<Partial<PanelInstanceContextType>>) => {
  const [title, setTitle] = useState<string>("");
  return (
    <PanelInstanceContext.Provider
      value={{
        title,
        setTitle,
        dockId: undefined,
        zIndex: 100,
        panelClose: () => {},
        dock: () => {},
        docked: false,
        panelName: "panelName",
        setPanelWindow: () => {},
        bounds: undefined,
        bringPanelToFront: () => {},
        panelPoppedOut: false,
        panelTogglePopout: () => {},
        undock: () => {},
        uniqueId: "uniqueId",
        ...props,
      }}
    >
      {children}
    </PanelInstanceContext.Provider>
  );
};

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
