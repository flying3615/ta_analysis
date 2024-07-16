import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";

import PlanSheetsHeaderButtons from "../PlanSheetsHeaderButtons";
import { PlanSheetMenuLabels } from "../PlanSheetType";

describe("PlanSheetsHeaderButtons", () => {
  const buttonLabels = [
    PlanSheetMenuLabels.LineArcReverse,
    PlanSheetMenuLabels.Delete,
    PlanSheetMenuLabels.PanMap,
    PlanSheetMenuLabels.ZoomOut,
    PlanSheetMenuLabels.ZoomIn,
    PlanSheetMenuLabels.ZoomPrevious,
    PlanSheetMenuLabels.ZoomCentre,
    PlanSheetMenuLabels.View,
    PlanSheetMenuLabels.Cursor,
    PlanSheetMenuLabels.SelectDiagram,
    PlanSheetMenuLabels.SelectLabel,
    PlanSheetMenuLabels.SelectCoordinates,
    PlanSheetMenuLabels.SelectLine,
    PlanSheetMenuLabels.SelectPolygon,
    PlanSheetMenuLabels.AddLabel,
    PlanSheetMenuLabels.AddLine,
    PlanSheetMenuLabels.FormatLinesText,
    PlanSheetMenuLabels.SelectRectangle,
  ];

  it("renders all header buttons", async () => {
    const renderAndVerifyButtons = async () => {
      renderWithReduxProvider(<PlanSheetsHeaderButtons />);
      for (const label of buttonLabels) {
        expect(await screen.findByRole("button", { name: label })).toBeInTheDocument();
      }
    };

    await renderAndVerifyButtons();
  });

  it("handles button clicks and updates the selected button label", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    window.alert = jest.fn();

    const handleButtonClicks = async () => {
      for (const label of buttonLabels) {
        const button = screen.getByRole("button", { name: label });
        await userEvent.click(button);
        expect(window.alert).toHaveBeenCalledWith("Not Yet Implemented");
      }
    };

    await handleButtonClicks();
  });
});
