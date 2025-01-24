import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DiagramTileComponent } from "@/components/PlanSheets/DiagramTileComponent";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { setupStore } from "@/redux/store";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { modifiedState, stateVersions } from "@/test-utils/store-mock";

describe.each(stateVersions)("Diagram Tile component state%s", (version) => {
  const mockStoreRedux = setupStore({
    planSheets: modifiedState(
      {
        pages: mockPlanData.pages,
        activePageNumbers: {
          [PlanSheetType.TITLE]: 1,
          [PlanSheetType.SURVEY]: 1,
        },
      },
      version,
    ),
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
        setNewActivePageNumber={jest.fn()}
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
        setNewActivePageNumber={jest.fn()}
      />,
      { store: mockStoreRedux },
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
        setNewActivePageNumber={jest.fn()}
      />,
      { store: mockStoreRedux },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    expect(screen.getByText("Diagram AB")).toBeInTheDocument();
    expect(screen.getAllByRole("presentation")).toHaveLength(2);
  });

  it("displays enabled Remove diagram button when diagram is in active page", () => {
    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={{ ...mockDiagramDisplay, pageRef: 1 }}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
        setNewActivePageNumber={jest.fn()}
      />,
      { store: mockStoreRedux },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    const removeFromSheetButton = screen.getByRole("button", { name: /Remove from sheet/i });
    expect(removeFromSheetButton).toBeInTheDocument();
    expect(removeFromSheetButton).not.toBeDisabled();
  });

  it("displays disabled Remove diagram button when diagram is not in active page", () => {
    renderWithReduxProvider(
      <DiagramTileComponent
        diagramDisplay={{ ...mockDiagramDisplay, pageRef: 3 }}
        selectedDiagramId={null}
        setSelectedDiagramId={jest.fn()}
        setNewActivePageNumber={jest.fn()}
      />,
      { store: mockStoreRedux },
    );

    expect(screen.getByText("Diagram A")).toBeInTheDocument();
    const removeFromSheetButton = screen.getByRole("button", { name: /Remove from sheet/i });
    expect(removeFromSheetButton).toBeInTheDocument();
    expect(removeFromSheetButton).toBeDisabled();
  });
});
