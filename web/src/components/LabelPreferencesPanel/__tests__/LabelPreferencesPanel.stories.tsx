import "@/components/LabelPreferencesPanel/LabelPreferencesPanel.scss";

import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick";
import { PanelsContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { setupStore } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { mockStore } from "@/test-utils/store-mock";
import { findCell, findCellContains, openAndClickMenuOption, selectCell } from "@/test-utils/storybook-ag-grid-utils";
import {
  PanelInstanceContextMock,
  StorybookRouter,
  waitForLoadingSpinnerToDisappear,
} from "@/test-utils/storybook-utils";

import { isHiddenObjectsVisibleByDefault, setHiddenObjectsVisibleByDefault } from "../labelPreferences";

const queryClient = new QueryClient();
export default {
  title: "LabelPreferencesPanel",
  component: LabelPreferencesPanel,
  argTypes: {
    transactionId: {
      control: "text",
    },
  },
  parameters: {
    chromatic: { delay: 300 },
  },
} as Meta<typeof LabelPreferencesPanel>;

const LabelPreferencesWrapper = ({ transactionId }: { transactionId: string }) => (
  <Provider store={setupStore({ ...mockStore })}>
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <PanelsContextProvider>
          <StorybookRouter url={generatePath(Paths.root, { transactionId })}>
            <Route
              path={Paths.root}
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
  </Provider>
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
NewPlansLabels.play = async ({ step }) => {
  await step("GIVEN I'm in the LabelPreferences tab", async () => {});
  await step("WHEN I navigate to new plan labels tab", async () => {
    const labelsForNewPlansTab = await screen.findByText("Labels for new plans");
    await userEvent.click(labelsForNewPlansTab);
  });
  await step("THEN I see the labels for new plans", async () => {});
};

export const ThisPlanRevertLabelPreferences: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  args: {
    transactionId: "123",
  },
};
ThisPlanRevertLabelPreferences.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });
  await step("GIVEN I'm in the LabelPreferences tab", async () => {});
  await step("WHEN I change font family to Arimo for Arc Radius label type", async () => {
    await openAndClickMenuOption("ARCR", "font", /Arimo/, table);
  });

  await step("AND I revert my changes", async () => {
    const revert = await findCell("ARCR", "revert", table);
    const revertButton = await findQuick(
      {
        classes: "[aria-label=revert]",
      },
      revert,
    );
    await userEvent.click(revertButton);
  });

  await step("THEN font family is reverted back to Roboto for Arc Radius label type", async () => {
    await findCellContains("ARCR", "font", "Roboto", table);
  });
};

export const ThisPlanSaveLabelPreferences: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/label-preference-update$/, () =>
          HttpResponse.json({ ok: true, statusCode: null, message: null }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
ThisPlanSaveLabelPreferences.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });
  await step("GIVEN I'm in the LabelPreferences tab", async () => {});
  await step("WHEN I update font family, size and weight for Arc Radius label type", async () => {});
  await openAndClickMenuOption("ARCR", "font", /Arial/, table);
  await openAndClickMenuOption("ARCR", "fontSize", "8", table);
  await selectCell("ARCR", "bold", table);
  await step("AND I save updated label preferences", async () => {
    const saveButton = await screen.findByText("Save");
    await userEvent.click(saveButton);
  });
  await step("THEN updated label preferences are saved", async () => {
    await waitForLoadingSpinnerToDisappear();
    const successMessage = await screen.findByText("All preferences up to date");
    await expect(successMessage).toBeTruthy();
  });
};

export const NewPlansSaveLabelPreferences: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/label-preference-update$/, () =>
          HttpResponse.json({ ok: true, statusCode: null, message: null }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
NewPlansSaveLabelPreferences.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });
  await step("GIVEN I'm in the New plans LabelPreferences tab", async () => {
    const labelsForNewPlansTab = await screen.findByText("Labels for new plans");
    await userEvent.click(labelsForNewPlansTab);
  });
  await step("WHEN I update font family, size and weight for Arc Radius label type", async () => {});
  await openAndClickMenuOption("ARCR", "font", /Arial/, table);
  await openAndClickMenuOption("ARCR", "fontSize", "8", table);
  await selectCell("ARCR", "bold", table);
  await step("AND I save updated label preferences", async () => {
    const saveButton = await screen.findByText("Save");
    await userEvent.click(saveButton);
  });
  await step("THEN updated label preferences are saved", async () => {
    await waitForLoadingSpinnerToDisappear();
    const successMessage = await screen.findByText("All preferences up to date");
    await expect(successMessage).toBeTruthy();
  });
};

export const HiddenObjectsInteraction: Story = {
  ...Default,
  beforeEach: () => {
    // clear setting
    setHiddenObjectsVisibleByDefault(undefined);
  },
  play: async () => {
    const hidden = await screen.findByRole("checkbox", { name: /Hidden objects visible by default/ });
    const label = await screen.findByTestId("hiddenObjectsVisibleByDefaultLabel");
    // default state
    await expect(hidden).toBeChecked();
    await expect(isHiddenObjectsVisibleByDefault()).toBeTruthy();
    // uncheck sets false
    await userEvent.click(label);
    await expect(hidden).not.toBeChecked();
    await expect(isHiddenObjectsVisibleByDefault()).toBeFalsy();
    // check sets true
    await userEvent.click(label);
    await expect(hidden).toBeChecked();
    await expect(isHiddenObjectsVisibleByDefault()).toBeTruthy();
    // reset
    setHiddenObjectsVisibleByDefault(undefined);
  },
};

export const HiddenObjectsStateHidden: Story = {
  ...Default,
  beforeEach: () => {
    setHiddenObjectsVisibleByDefault(false);
  },
  play: async () => {
    const input = await screen.findByRole("checkbox", { name: /Hidden objects visible by default/ });
    await expect(input).not.toBeChecked();
    await expect(isHiddenObjectsVisibleByDefault()).toBeFalsy();
    // reset
    setHiddenObjectsVisibleByDefault(undefined);
  },
};

export const HiddenObjectsStateVisible: Story = {
  ...Default,
  beforeEach: () => {
    setHiddenObjectsVisibleByDefault(true);
  },
  play: async () => {
    const input = await screen.findByRole("checkbox", { name: /Hidden objects visible by default/ });
    await expect(input).toBeChecked();
    await expect(isHiddenObjectsVisibleByDefault()).toBeTruthy();
    // reset
    setHiddenObjectsVisibleByDefault(undefined);
  },
};
