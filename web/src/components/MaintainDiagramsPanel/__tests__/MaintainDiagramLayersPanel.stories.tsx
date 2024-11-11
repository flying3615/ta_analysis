import "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel.scss";

import { LuiMessagingContextProvider } from "@linzjs/lui";
import { findQuick } from "@linzjs/step-ag-grid/src/utils/testQuick";
import { LuiModalAsyncContextProvider, PanelsContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Route } from "react-router";
import { generatePath } from "react-router-dom";

import { MaintainDiagramsPanel } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import {
  clickLayersLabelCheckbox,
  clickLayersSelectButton,
  findCellContains,
  getLayerSelectedState,
  getLayersLabelCheckbox,
} from "@/test-utils/storybook-ag-grid-utils";
import { PanelInstanceContextMock, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

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
  <LuiModalAsyncContextProvider>
    <LuiMessagingContextProvider version="v2">
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
    </LuiMessagingContextProvider>
  </LuiModalAsyncContextProvider>
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

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
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
  const maintainIndividualUserDefinedDiagramsTab = await screen.findByText("Individual user-defined diagram");
  await userEvent.click(maintainIndividualUserDefinedDiagramsTab);
};

export const MaintainDiagramsLayersSave: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/diagram-layers-by-diagram-type$/, () =>
          HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
MaintainDiagramsLayersSave.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
  await step("WHEN I click the select button for the Existing Parcels layer", async () => {
    await clickLayersSelectButton("23", table);
  });
  await step("AND click Save button", async () => {
    const saveButton = await screen.findByText("Save");
    await userEvent.click(saveButton);
  });
  await step("THEN updated layer preferences are saved", async () => {
    const continueButton = await screen.findByText("Continue");
    await userEvent.click(continueButton);
    await expect(await screen.findByText("All layers up to date")).toBeTruthy();
  });
};

export const MaintainDiagramsLayersErrorOnSave: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/diagram-layers-by-diagram-type$/, () =>
          HttpResponse.json({ ok: true }, { status: 500, statusText: "Internal server error" }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
MaintainDiagramsLayersErrorOnSave.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
  await step("WHEN I click the select button for the Existing Parcels layer", async () => {
    await clickLayersSelectButton("23", table);
  });
  await step("AND click Save button", async () => {
    const saveButton = await screen.findByText("Save");
    await userEvent.click(saveButton);
  });
  await step("THEN updated layer preferences are saved", async () => {
    const continueButton = await screen.findByText("Continue");
    await userEvent.click(continueButton);
    const toastMessage = await screen.findByText("Error updating diagram layer preferences.");
    await expect(toastMessage).toBeTruthy();
  });
};
export const MaintainDiagramsLayersUnsavedChangesDiscard: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/diagram-layers-by-diagram-type$/, () =>
          HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
MaintainDiagramsLayersUnsavedChangesDiscard.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
  await step("WHEN I click the select button for the Existing Parcels layer", async () => {
    await clickLayersSelectButton("23", table);
  });
  await step("AND I change diagram type and discard changes", async () => {
    const diagramTypeSelectDropDown = await findQuick({ classes: ".LuiSelect-select" });
    await userEvent.selectOptions(diagramTypeSelectDropDown, "System Generated Survey Diagram");
    await userEvent.click(await screen.findByText("Discard"));
  });
  await step("THEN changes are discarded and user is navigated to new diagram type", async () => {});
};

export const DiscardUnsavedChangesWhenChangingTabsFromDiagramType: Story = {
  ...Default,
  args: {
    transactionId: "123",
  },
  play: async ({ step }) => {
    const table = await findQuick({ classes: ".LuiTabsPanel--active" });

    await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
    await step("WHEN I enable and then uncheck Existing Parcels layer labels", async () => {
      await clickLayersSelectButton("23", table);
      await clickLayersLabelCheckbox("23", table);
      await sleep(100);
      // verify checkbox before discard
      await expect(await getLayersLabelCheckbox("23", table)).not.toBeChecked();
    });
    await step("AND I change to the Individual user-defined tab and discard changes", async () => {
      await userEvent.click(await screen.findByText("Individual user-defined diagram"));
      await userEvent.click(await screen.findByText("Discard"));
      await sleep(1000);
    });
    await step("THEN changes are discarded when returning to Diagrams tab", async () => {
      await userEvent.click(await screen.findByText("Diagram type", { selector: ".LuiTab" }));
      // verify checkbox after discard
      await expect(await getLayersLabelCheckbox("23", table)).toBeChecked();
    });
  },
};

export const DiscardUnsavedChangesWhenChangingTabsFromIndividual: Story = {
  ...Default,
  args: {
    transactionId: "123",
  },
  play: async ({ step }) => {
    let table: HTMLElement;

    await step("GIVEN I'm in the Individual tab of Maintain diagram layers", async () => {
      await userEvent.click(await screen.findByText("Individual user-defined diagram"));
      await sleep(1000);
      table = await findQuick({ classes: ".LuiTabsPanel--active" });
    });
    await step("WHEN I enable and then uncheck Existing Parcels layer labels", async () => {
      await clickLayersSelectButton("42", table);
      await clickLayersLabelCheckbox("42", table);
      await sleep(100);
      // verify checkbox before discard
      await expect(await getLayersLabelCheckbox("42", table)).not.toBeChecked();
    });
    await step("AND I change to the Diagram type tab and discard changes", async () => {
      await userEvent.click(await screen.findByText("Diagram type", { selector: ".LuiTab" }));
      await userEvent.click(await screen.findByText("Discard"));
      await sleep(1000);
    });
    await step("THEN changes are discarded when returning to Diagrams tab", async () => {
      await userEvent.click(await screen.findByText("Individual user-defined diagram"));
      // verify checkbox after discard
      await expect(await getLayersLabelCheckbox("42", table)).toBeChecked();
    });
  },
};

export const MaintainDiagramsLayersUnsavedChangesCancel: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    msw: {
      handlers: [
        ...handlers,
        http.put(/\/123\/diagram-layers-by-diagram-type$/, () =>
          HttpResponse.json({ ok: true }, { status: 200, statusText: "OK" }),
        ),
      ],
    },
  },
  args: {
    transactionId: "123",
  },
};
MaintainDiagramsLayersUnsavedChangesCancel.play = async ({ step }) => {
  const table = await findQuick({ classes: ".LuiTabsPanel--active" });

  await step("GIVEN I'm in the Diagrams tab of Maintain diagram layers", async () => {});
  await step("WHEN I click the select button for the Existing Parcels layer", async () => {
    await clickLayersSelectButton("23", table);
  });
  await step("AND I change diagram type and click on cancel", async () => {
    const diagramTypeSelectDropDown = await findQuick({ classes: ".LuiSelect-select" });
    await userEvent.selectOptions(diagramTypeSelectDropDown, "System Generated Survey Diagram");
    const buttonGroup = await findQuick({ classes: ".LuiModalAsync-ButtonGroup" });
    const cancelButton = await findQuick({ tagName: "button", text: "Cancel" }, buttonGroup);
    await userEvent.click(cancelButton);
  });
  await step(
    "THEN user stays on System Generated Primary Diagram and navigation to different diagram type is cancelled",
    async () => {},
  );
};
