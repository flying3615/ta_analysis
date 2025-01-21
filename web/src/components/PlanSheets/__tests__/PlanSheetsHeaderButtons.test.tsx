import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanSheetsHeaderButtons } from "@/components/PlanSheets/PlanSheetsHeaderButtons";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { modifiedStateV1 } from "@/test-utils/store-mock";

jest.mock("@/hooks/useCytoscapeContext");

jest.mock("@/hooks/useTransactionId", () => ({
  useTransactionId: () => 123,
}));

const mockStoreRedux = setupStore({
  planSheets: {
    ...modifiedStateV1({
      pages: [],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 1,
      },
    }),
  },
});

describe("PlanSheetsHeaderButtons", () => {
  const activeButtonLabels = [
    [PlanMode.Undo],
    [PlanMode.View],
    [PlanMode.Delete],
    [PlanMode.Cursor],
    [PlanMode.SelectDiagram],
    [PlanMode.SelectLabel],
    [PlanMode.SelectCoordinates],
    [PlanMode.SelectLine],
    [PlanMode.AddLabel],
    [PlanMode.AddLine],
  ];
  const inactiveButtonLabels = [[PlanMode.SelectPolygon], [PlanMode.FormatLinesText], [PlanMode.SelectRectangle]];

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

  it.each(activeButtonLabels)("renders the %s header button", async (label: PlanMode) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    expect(await screen.findByRole("button", { name: label })).toBeInTheDocument();
  });

  it.each(inactiveButtonLabels)("does not render the %s header button", (label: PlanMode) => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    expect(screen.queryByRole("button", { name: label })).toBeNull();
  });

  it("should disable all buttons with Not Implemented", () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const buttons = screen.queryAllByRole("button", { name: PlanMode.NotImplemented });
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button).toBeDisabled());
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

  it("should disable Zoom in tool button when at maximum", () => {
    (useCytoscapeContext as jest.Mock).mockReturnValue({
      isMaxZoom: true,
    });

    renderWithReduxProvider(<PlanSheetsHeaderButtons />);
    const button = screen.getByRole("button", { name: "Zoom in tool" });
    expect(button).not.toBeEnabled();
  });

  it("should disable Zoom out tool button when at minimum", () => {
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

    expect(mockStoreRedux.getState().planSheets.v1.planMode).toStrictEqual(PlanMode.SelectCoordinates);
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

    expect(button).toHaveClass("selected");

    expect(mockStoreRedux.getState().planSheets.v1.planMode).toStrictEqual(PlanMode.SelectLine);
  });

  it("should handle select labels click", async () => {
    renderWithReduxProvider(<PlanSheetsHeaderButtons />, { store: mockStoreRedux });
    const button = screen.getByRole("button", { name: PlanMode.SelectLabel });
    await userEvent.click(button);

    expect(button).toHaveClass("selected");

    expect(mockStoreRedux.getState().planSheets.v1.planMode).toStrictEqual(PlanMode.SelectLabel);
  });
});
