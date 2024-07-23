import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";

import PlanSheetsHeaderButtons from "../PlanSheetsHeaderButtons";
import { PlanSheetMenuLabels } from "../PlanSheetType";

describe("PlanSheetsHeaderButtons", () => {
  const buttonLabels = [
    [PlanSheetMenuLabels.LineArcReverse],
    [PlanSheetMenuLabels.Delete],
    [PlanSheetMenuLabels.PanMap],
    [PlanSheetMenuLabels.ZoomOut],
    [PlanSheetMenuLabels.ZoomIn],
    [PlanSheetMenuLabels.ZoomPrevious],
    [PlanSheetMenuLabels.ZoomCentre],
    [PlanSheetMenuLabels.View],
    [PlanSheetMenuLabels.Cursor],
    [PlanSheetMenuLabels.SelectDiagram],
    [PlanSheetMenuLabels.SelectLabel],
    [PlanSheetMenuLabels.SelectCoordinates],
    [PlanSheetMenuLabels.SelectLine],
    [PlanSheetMenuLabels.SelectPolygon],
    [PlanSheetMenuLabels.AddLabel],
    [PlanSheetMenuLabels.AddLine],
    [PlanSheetMenuLabels.FormatLinesText],
    [PlanSheetMenuLabels.SelectRectangle],
  ];

  it.each(buttonLabels)("renders the %s header button", async (label: PlanSheetMenuLabels) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    expect(await screen.findByRole("button", { name: label })).toBeInTheDocument();
  });

  it.each(buttonLabels)("handles button clicks and updates the %s button label", async (label: PlanSheetMenuLabels) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    window.alert = jest.fn();

    const button = screen.getByRole("button", { name: label });
    await userEvent.click(button);
    expect(window.alert).toHaveBeenCalledWith("Not Yet Implemented");
  });
});
