import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanSheetsHeaderButtons } from "@/components/PlanSheets/PlanSheetsHeaderButtons";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { setupStore } from "@/redux/store.ts";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock.ts";

jest.mock("@/hooks/useCytoscapeContext");

const mockedUseTransactionId = jest.fn();
jest.mock("@/hooks/useTransactionId", () => ({
  useTransactionId: () => mockedUseTransactionId(),
}));

const mockStoreRedux = setupStore({
  planSheets: {
    ...mockStore.planSheets,
    pages: [],
    activePageNumbers: {
      [PlanSheetType.TITLE]: 1,
      [PlanSheetType.SURVEY]: 1,
    },
  },
});

describe("PlanSheetsHeaderButtons", () => {
  const buttonLabels = [
    [PlanMode.LineArcReverse],
    [PlanMode.Delete],
    [PlanMode.View],
    [PlanMode.Cursor],
    [PlanMode.SelectDiagram],
    [PlanMode.SelectLabel],
    [PlanMode.SelectCoordinates],
    [PlanMode.SelectLine],
    [PlanMode.SelectPolygon],
    [PlanMode.AddLabel],
    [PlanMode.AddLine],
    [PlanMode.FormatLinesText],
    [PlanMode.SelectRectangle],
  ];

  const zoomByDeltaMock = jest.fn();
  const zoomToFitMock = jest.fn();

  beforeEach(() => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      zoomByDelta: zoomByDeltaMock,
      zoomToFit: zoomToFitMock,
      applyGraphOptions: () => {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each(buttonLabels)("renders the %s header button", async (label: PlanMode) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    expect(await screen.findByRole("button", { name: label })).toBeInTheDocument();
  });

  it.each([
    [PlanMode.LineArcReverse],
    [PlanMode.Delete],
    [PlanMode.View],
    [PlanMode.SelectPolygon],
    [PlanMode.AddLine],
    [PlanMode.FormatLinesText],
    [PlanMode.SelectRectangle],
  ])("handles unimplemented button %s", async (label: PlanMode) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    window.alert = jest.fn();

    const button = screen.getByRole("button", { name: label });
    await userEvent.click(button);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Not Yet Implemented"));
  });

  it("displays Zoom In, Zoom Out, and Zoom to Fit buttons in the toolbar", () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);

    expect(screen.getByRole("button", { name: PlanMode.ZoomIn })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PlanMode.ZoomIn })).toBeEnabled();
    expect(screen.getByRole("button", { name: PlanMode.ZoomOut })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PlanMode.ZoomOut })).toBeEnabled();
    expect(screen.getByRole("button", { name: PlanMode.ZoomCentre })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PlanMode.ZoomCentre })).toBeEnabled();
  });

  it("should handle Zoom in tool button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom in tool" });
    await userEvent.click(button);
    expect(zoomByDeltaMock).toHaveBeenCalledWith(0.5);
  });

  it("should handle Zoom out tool button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom out tool" });
    await userEvent.click(button);
    expect(zoomByDeltaMock).toHaveBeenCalledWith(-0.5);
  });

  it("should disable Zoom in tool button when at maximum", async () => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      isMaxZoom: true,
    });

    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom in tool" });
    expect(button).not.toBeEnabled();
  });

  it("should disable Zoom out tool button when at minimum", async () => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      isMinZoom: true,
    });

    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom out tool" });
    expect(button).not.toBeEnabled();
  });

  it("should handle Zoom centre button click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom centre" });
    await userEvent.click(button);
    expect(zoomToFitMock).toHaveBeenCalled();
  });

  it("should handle select coordinates click", async () => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      zoomByDelta: zoomByDeltaMock,
      zoomToFit: zoomToFitMock,
      applyGraphOptions: (options: { nodeSelectable: boolean; edgeSelectable: boolean; elements: string }) => {
        expect(options.nodeSelectable).toBeTruthy();
        expect(options.edgeSelectable).toBeFalsy();
        expect(options.elements).toBeUndefined();
      },
    });

    renderWithReduxProvider(<PlanSheetsHeaderButtons />, { store: mockStoreRedux });
    const button = screen.getByRole("button", { name: "Select Coordinates" });
    await userEvent.click(button);

    await waitFor(() => expect(button).toHaveClass("selected"));

    expect(mockStoreRedux.getState().planSheets.planMode).toStrictEqual(PlanMode.SelectCoordinates);
  });

  it("should handle select lines click", async () => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      zoomByDelta: zoomByDeltaMock,
      zoomToFit: zoomToFitMock,
      applyGraphOptions: (options: { nodeSelectable: boolean; edgeSelectable: boolean; elements: string }) => {
        expect(options.nodeSelectable).toBeFalsy();
        expect(options.edgeSelectable).toBeTruthy();
        expect(options.elements).toBeUndefined();
      },
    });

    renderWithReduxProvider(<PlanSheetsHeaderButtons />, { store: mockStoreRedux });
    const button = screen.getByRole("button", { name: "Select Lines" });
    await userEvent.click(button);

    await expect(button).toHaveClass("selected");

    expect(mockStoreRedux.getState().planSheets.planMode).toStrictEqual(PlanMode.SelectLine);
  });

  it("should handle select labels click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />, { store: mockStoreRedux });
    const button = screen.getByRole("button", { name: "Select Labels" });
    await userEvent.click(button);

    await expect(button).toHaveClass("selected");

    expect(mockStoreRedux.getState().planSheets.planMode).toStrictEqual(PlanMode.SelectLabel);
  });
});
