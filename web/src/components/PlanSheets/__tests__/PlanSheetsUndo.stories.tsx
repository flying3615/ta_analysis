import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { MovePageAndDiagramLabels } from "@/components/PlanSheets/__tests__/PageLabel.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { sleep, tabletLandscapeParameters } from "@/test-utils/storybook-utils";

import { MoveDiagramLine, MoveDiagramNode } from "../interactions/__tests__/MoveSelectedHandler.stories";
import { Default, DeletePage, HideCoordinate, HideLine, MoveDiagram, Story } from "./PlanSheets.stories";

export default {
  title: "PlanSheets/Undo",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const undo = (component: Story & Required<Pick<Story, "play">>): Story => ({
  ...Default,
  ...tabletLandscapeParameters,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const undoButton = await waitFor(async () => {
      // eslint-disable-next-line testing-library/no-node-access
      const undo = (await canvas.findByTitle("Undo")).parentElement;
      await expect(undo).toBeInTheDocument();
      await expect(undo).toBeDisabled();
      return undo;
    });

    await component.play(context);

    await expect(undoButton).toBeEnabled();
    await userEvent.click(undoButton as HTMLElement);

    await sleep(500);
    await expect(undoButton).toBeDisabled();
  },
});

export const UndoDeletePage = undo(DeletePage);
export const UndoMoveDiagram = undo(MoveDiagram);
export const UndoHideCoordinate = undo(HideCoordinate);
export const UndoHideLine = undo(HideLine);

export const UndoMoveDiagramLine = undo(MoveDiagramLine);
export const UndoMoveDiagramNode = undo(MoveDiagramNode);
export const UndoMoveDiagramAndPageLabel = undo(MovePageAndDiagramLabels);
