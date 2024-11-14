import { Meta } from "@storybook/react";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { pressEscapeKey } from "@/test-utils/storybook-utils";

import {
  SelectCoordinates,
  SelectDiagram,
  SelectLine,
  SelectLineAndLinkedLabel,
  SelectMarkAndLinkedLabel,
  Story,
} from "./PlanSheets.stories";

export default {
  title: "PlanSheets/PressEscapeKey",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const playEscapeKey = (component: Story & Required<Pick<Story, "play">>): Story => ({
  ...component,
  play: async (context) => {
    await component.play(context);
    pressEscapeKey(context.canvasElement);
  },
});

export const EscapeDeselectsDiagram = playEscapeKey(SelectDiagram);
export const EscapeDeselectsSelectedLine = playEscapeKey(SelectLine);
export const EscapeDeselectsSelectedCoordinates = playEscapeKey(SelectCoordinates);
export const EscapeDeselectsSelectedLineAndLinkedLabel = playEscapeKey(SelectLineAndLinkedLabel);
export const EscapeDeselectsSelectedMarkAndLinkedLabel = playEscapeKey(SelectMarkAndLinkedLabel);
