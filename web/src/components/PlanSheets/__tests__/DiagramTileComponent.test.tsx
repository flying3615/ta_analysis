import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DiagramTileComponent } from "@/components/PlanSheets/DiagramTileComponent";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

describe("Diagram Tile component", () => {
  const mockStore = setupStore({
    planSheets: {
      diagrams: [],
      pages: mockPlanData.pages,
      hasChanges: false,
      activeSheet: PlanSheetType.TITLE,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 1,
      },
    },
  });

  const mockDiagramDisplay = {
    diagramId: 3,
    level: 1,
    pageRef: undefined,
    diagramLabel: "Diagram A",
    diagramChildren: [],
    listOrder: 1,
  };

  it("renders correctly", () => {
    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={mockDiagramDisplay}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
      />,
    );

    expect(screen.getByRole("presentation")).toBeInTheDocument();
    expect(screen.getByText("Diagram A")).toBeInTheDocument();
  });

  it("selects the diagram on click", async () => {
    const setSelectedDiagramId = jest.fn();

    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={mockDiagramDisplay}
        selectedDiagramId={null}
        setSelectedDiagramId={setSelectedDiagramId}
      />,
      { store: mockStore },
    );

    await userEvent.click(screen.getByText("Diagram A"));
    expect(setSelectedDiagramId).toHaveBeenCalledWith(3);
  });

  it("renders nested DiagramTileComponent instances correctly", () => {
    const nestedDiagramDisplay = {
      ...mockDiagramDisplay,
      diagramChildren: [{ ...mockDiagramDisplay, diagramLabel: "Diagram AB" }],
    };

    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={nestedDiagramDisplay}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
      />,
      { store: mockStore },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    expect(screen.getByText("Diagram AB")).toBeInTheDocument();
    expect(screen.getAllByRole("presentation")).toHaveLength(2);
  });

  it("displays enabled Remove diagram button when diagram is in active page", async () => {
    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={{ ...mockDiagramDisplay, pageRef: 1 }}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
      />,
      { store: mockStore },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    const removeFromSheetButton = screen.getByRole("button", { name: /Remove from sheet/i });
    expect(removeFromSheetButton).toBeInTheDocument();
    expect(removeFromSheetButton).not.toBeDisabled();
  });

  it("displays disabled Remove diagram button when diagram is not in active page", async () => {
    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={{ ...mockDiagramDisplay, pageRef: 3 }}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
      />,
      { store: mockStore },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    const removeFromSheetButton = screen.getByRole("button", { name: /Remove from sheet/i });
    expect(removeFromSheetButton).toBeInTheDocument();
    expect(removeFromSheetButton).toBeDisabled();
  });
});
