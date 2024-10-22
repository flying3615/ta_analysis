import { DiagramDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { fireEvent, screen } from "@testing-library/react";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";

import { MoveDiagramToPageModal } from "../MoveDiagramToPageModal";

describe("MoveDiagramToPageModal", () => {
  const page1 = { id: 4, pageNumber: 1, pageType: PlanSheetType.TITLE } as PageDTO;
  const page2 = { id: 3, pageNumber: 2, pageType: PlanSheetType.TITLE } as PageDTO;
  const page3 = { id: 2, pageNumber: 3, pageType: PlanSheetType.TITLE } as PageDTO;
  const page4 = { id: 1, pageNumber: 1, pageType: PlanSheetType.SURVEY } as PageDTO;
  const diagram1 = { id: 1, pageRef: 4 } as DiagramDTO;
  const diagram2 = { id: 2, pageRef: 3 } as DiagramDTO;

  const diagramIdToMove = diagram1.id;

  const initialState: PlanSheetsState = {
    diagrams: [diagram1, diagram2],
    pages: [page1, page2, page3, page4],
    hasChanges: false,
    diagramIdToMove,

    configs: [],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 1,
      [PlanSheetType.SURVEY]: 0,
    },
    planMode: PlanMode.View,
    previousDiagramAttributesMap: {},
    previousDiagrams: null,
    previousPages: null,
  };

  it("can move a diagram to an existing page", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });

    const existingPageRadio = await screen.findByLabelText("An existing page");
    expect(existingPageRadio).toBeChecked();
    expect(screen.queryByText("Enter a number between 1 and 1")).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText("Enter page number");
    expect(input).toBeInTheDocument();

    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);
    expect(await screen.findByText("Enter a number between 1 and 3")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "1" } });
    expect(await screen.findByText("Diagram is already on page 1")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "0" } });
    expect(await screen.findByText("Enter a number between 1 and 3")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "ABC" } });
    expect(await screen.findByText("Enter a number between 1 and 3")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "4" } });
    expect(await screen.findByText("Enter a number between 1 and 3")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "2" } });
    expect(screen.queryByText("Enter a number between 1 and 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagram is already on page 2")).not.toBeInTheDocument();

    fireEvent.click(continueButton);

    const updatedState = store.getState().planSheets;
    expect(updatedState.diagrams).toStrictEqual([{ ...diagram1, pageRef: 3 }, diagram2]);
    expect(updatedState.pages).toStrictEqual(initialState.pages);
    expect(updatedState.diagramIdToMove).toBeUndefined();
    expect(updatedState.activePageNumbers).toStrictEqual({
      ...initialState.activePageNumbers,
      [PlanSheetType.TITLE]: 2,
    });
    expect(updatedState.hasChanges).toBe(true);
    expect(updatedState.previousHasChanges).toBe(false);
    expect(updatedState.previousDiagrams).toStrictEqual(initialState.diagrams);
    expect(updatedState.previousPages).toStrictEqual(initialState.pages);
  });

  it("can move a diagram to a new last page", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new last page"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    expect(updatedState.diagrams).toStrictEqual([{ ...diagram1, pageRef: 5 }, diagram2]);
    expect(updatedState.pages).toStrictEqual([
      page1,
      page2,
      page3,
      page4,
      { id: 5, pageNumber: 4, pageType: PlanSheetType.TITLE },
    ]);
    expect(updatedState.activePageNumbers).toStrictEqual({
      ...initialState.activePageNumbers,
      [PlanSheetType.TITLE]: 4,
    });
    expect(updatedState.diagramIdToMove).toBeUndefined();
    expect(updatedState.hasChanges).toBe(true);
  });

  it("can move a diagram to a new page after this one", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new page after this one"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    expect(updatedState.diagrams).toStrictEqual([{ ...diagram1, pageRef: 6 }, diagram2]);
    expect(updatedState.pages).toStrictEqual([
      page1,
      { ...page2, pageNumber: 3 },
      { ...page3, pageNumber: 4 },
      { id: 6, pageNumber: 2, pageType: PlanSheetType.TITLE },
      page4,
    ]);
    expect(updatedState.activePageNumbers).toStrictEqual({
      ...initialState.activePageNumbers,
      [PlanSheetType.TITLE]: 2,
    });
    expect(updatedState.diagramIdToMove).toBeUndefined();
    expect(updatedState.hasChanges).toBe(true);
  });

  it("can move a diagram to a new first page", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new first page"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    expect(updatedState.diagrams).toStrictEqual([{ ...diagram1, pageRef: 5 }, diagram2]);
    expect(updatedState.pages).toStrictEqual([
      { id: 5, pageNumber: 1, pageType: PlanSheetType.TITLE },
      { ...page1, pageNumber: 2 },
      { ...page2, pageNumber: 3 },
      { ...page3, pageNumber: 4 },
      page4,
    ]);
    expect(updatedState.activePageNumbers).toStrictEqual({
      ...initialState.activePageNumbers,
      [PlanSheetType.TITLE]: 1,
    });
    expect(updatedState.diagramIdToMove).toBeUndefined();
    expect(updatedState.hasChanges).toBe(true);
  });

  it("only unsets the diagram to move when cancel is clicked", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new first page"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(store.getState().planSheets).toStrictEqual({
      ...initialState,
      diagramIdToMove: undefined,
    });
  });
});
