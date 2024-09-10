import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanSheetsHeaderButtons } from "@/components/PlanSheets/PlanSheetsHeaderButtons";
import { PlanSheetMenuLabels } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

jest.mock("@/hooks/useCytoscapeContext");

describe("PlanSheetsHeaderButtons", () => {
  const buttonLabels = [
    [PlanSheetMenuLabels.LineArcReverse],
    [PlanSheetMenuLabels.Delete],
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

  const zoomByDeltaMock = jest.fn();
  const zoomToFitMock = jest.fn();

  beforeEach(() => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      zoomByDelta: zoomByDeltaMock,
      zoomToFit: zoomToFitMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it("displays Zoom In, Zoom Out, and Zoom to Fit buttons in the toolbar", () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);

    expect(screen.getByRole("button", { name: PlanSheetMenuLabels.ZoomIn })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PlanSheetMenuLabels.ZoomOut })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PlanSheetMenuLabels.ZoomCentre })).toBeInTheDocument();
  });

  it("should handle Zoom in button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom in" });
    await userEvent.click(button);
    expect(zoomByDeltaMock).toHaveBeenCalledWith(0.5);
  });

  it("should handle Zoom out button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom out" });
    await userEvent.click(button);
    expect(zoomByDeltaMock).toHaveBeenCalledWith(-0.5);
  });

  it("should handle Zoom centre button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom centre" });
    await userEvent.click(button);
    expect(zoomToFitMock).toHaveBeenCalled();
  });
});
