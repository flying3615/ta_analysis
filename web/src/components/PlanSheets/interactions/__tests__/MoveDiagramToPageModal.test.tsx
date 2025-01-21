import { DiagramDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { fireEvent, screen } from "@testing-library/react";

import { CSS_PIXELS_PER_CM } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { defaultOptionalVisibileLabelTypes } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { modifiedStateV1 } from "@/test-utils/store-mock";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";

import { MoveDiagramToPageModal } from "../MoveDiagramToPageModal";

describe("MoveDiagramToPageModal", () => {
  const page1 = { id: 4, pageNumber: 1, pageType: PlanSheetType.TITLE } as PageDTO;
  const page2 = { id: 3, pageNumber: 2, pageType: PlanSheetType.TITLE } as PageDTO;
  const page3 = { id: 2, pageNumber: 3, pageType: PlanSheetType.TITLE } as PageDTO;
  const page4 = { id: 1, pageNumber: 1, pageType: PlanSheetType.SURVEY } as PageDTO;
  const diagram1 = {
    id: 1,
    pageRef: 4,
    originPageOffset: { x: 0, y: 0 },
    zoomScale: 100,
    bottomRightPoint: { x: 40, y: -10 },
    labels: [
      {
        id: 1000,
        displayText: "Label 1",
        font: "Arial",
        fontSize: 16,
        position: { x: 20, y: -0.005 },
      },
    ],
    lineLabels: [
      {
        id: 1002,
        displayText: "Line Label",
        font: "Arial",
        fontSize: 16,
        pointOffset: 6,
        anchorAngle: 90,
        textAlignment: "centerCenter",
        position: { x: 20, y: 0 },
      },
    ],
    coordinateLabels: [
      {
        id: 1001,
        displayText: "Mark Label",
        font: "Tahoma",
        fontSize: 16,
        position: { x: -0.1, y: -10 },
      },
    ],
    parcelLabelGroups: [
      {
        id: 1002,
        labels: [
          {
            id: 1003,
            displayText: "Parcel App",
            font: "Arial",
            fontSize: 16,
            position: { x: 25, y: 1.5 },
            anchorAngle: 90,
            pointOffset: 16,
          },
          {
            id: 1004,
            displayText: "Parcel Area",
            font: "Arial",
            fontSize: 14,
            position: { x: 25, y: 1.5 },
            anchorAngle: 270,
            pointOffset: 14,
          },
        ],
      },
    ],
  } as unknown as DiagramDTO;
  const diagram2 = {
    id: 2,
    pageRef: 3,
    labels: undefined,
    coordinateLabels: undefined,
    parcelLabelGroups: undefined,
  } as unknown as DiagramDTO;

  const diagramIdToMove = diagram1.id;

  const initialState: PlanSheetsState = modifiedStateV1({
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
    canViewHiddenLabels: true,
    viewableLabelTypes: defaultOptionalVisibileLabelTypes,
  });

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
    expect(updatedState.v1.diagrams[1]).toStrictEqual(diagram2);
    expect(updatedState.v1.diagrams[0]?.pageRef).toBe(3);
    expect(updatedState.v1.diagrams[0]?.originPageOffset).toStrictEqual({ x: 0.015, y: -0.015 });
    expect(updatedState.v1.diagrams[0]?.zoomScale).toBe(diagram1.zoomScale);
    expect(updatedState.v1.diagrams[0]?.bottomRightPoint).toStrictEqual(diagram1.bottomRightPoint);
    expect(updatedState.v1.pages).toStrictEqual(initialState.v1.pages);
    expect(updatedState.v1.diagramIdToMove).toBeUndefined();
    expect(updatedState.v1.activePageNumbers).toStrictEqual({
      ...initialState.v1.activePageNumbers,
      [PlanSheetType.TITLE]: 2,
    });
    expect(updatedState.v1.hasChanges).toBe(true);
    expect(updatedState.v1.previousHasChanges).toBe(false);
    expect(updatedState.v1.previousDiagrams).toStrictEqual(initialState.v1.diagrams);
    expect(updatedState.v1.previousPages).toStrictEqual(initialState.v1.pages);
  });

  it("can move a diagram to a new last page", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new last page"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    // We expect offscreen labels to have moved on screen
    // by applying an offset to their position
    expect(updatedState.v1.diagrams[1]).toStrictEqual(diagram2);
    expect(updatedState.v1.diagrams[0]?.pageRef).toBe(5);
    expect(updatedState.v1.diagrams[0]?.originPageOffset).toStrictEqual({ x: 0.015, y: -0.015 });
    expect(updatedState.v1.diagrams[0]?.zoomScale).toBe(100);
    expect(updatedState.v1.diagrams[0]?.bottomRightPoint).toStrictEqual({ x: 40, y: -10 });

    expect(updatedState.v1.diagrams[0]?.labels).toHaveLength(1);
    expect(updatedState.v1.diagrams[0]?.labels?.[0]?.id).toBe(1000);
    expect(updatedState.v1.diagrams[0]?.labels?.[0]?.displayText).toBe("Label 1");
    expect(updatedState.v1.diagrams[0]?.labels?.[0]?.anchorAngle).toBe(270);
    expect(updatedState.v1.diagrams[0]?.labels?.[0]?.pointOffset).toBeCloseTo(5.86);
    expect(updatedState.v1.diagrams[0]?.labels?.[0]?.position).toStrictEqual({ x: 20, y: -0.005 });

    expect(updatedState.v1.diagrams[0]?.coordinateLabels).toHaveLength(1);
    expect(updatedState.v1.diagrams[0]?.coordinateLabels?.[0]?.id).toBe(1001);
    expect(updatedState.v1.diagrams[0]?.coordinateLabels?.[0]?.displayText).toBe("Mark Label");
    expect(updatedState.v1.diagrams[0]?.coordinateLabels?.[0]?.anchorAngle).toBeCloseTo(0);
    expect(updatedState.v1.diagrams[0]?.coordinateLabels?.[0]?.pointOffset).toBeCloseTo(62.84);
    expect(updatedState.v1.diagrams[0]?.coordinateLabels?.[0]?.position).toStrictEqual({ x: -0.1, y: -10 });

    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups).toHaveLength(1);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.id).toBe(1002);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels).toHaveLength(2);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[0]?.id).toBe(1003); // Parcel App
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[0]?.displayText).toBe("Parcel App");
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[0]?.anchorAngle).toBe(270);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[0]?.pointOffset).toBeCloseTo(48.52);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[0]?.position).toStrictEqual({ x: 25, y: 1.5 });
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[1]?.id).toBe(1004); // Parcel Area
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[1]?.displayText).toBe("Parcel Area");
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[1]?.anchorAngle).toBe(270);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[1]?.pointOffset).toBeCloseTo(47.77);
    expect(updatedState.v1.diagrams[0]?.parcelLabelGroups?.[0]?.labels?.[1]?.position).toStrictEqual({ x: 25, y: 1.5 });

    expect(updatedState.v1.diagrams[0]?.lineLabels).toHaveLength(1);
    expect(updatedState.v1.diagrams[0]?.lineLabels[0]?.id).toBe(1002);
    expect(updatedState.v1.diagrams[0]?.lineLabels[0]?.position).toStrictEqual({ x: 20, y: 0 });
    expect(updatedState.v1.diagrams[0]?.lineLabels[0]?.pointOffset).toBeCloseTo(
      ((16 / 2) * POINTS_PER_CM) / CSS_PIXELS_PER_CM,
    );
    expect(updatedState.v1.diagrams[0]?.lineLabels[0]?.anchorAngle).toBe(270);

    expect(updatedState.v1.pages).toStrictEqual([
      page1,
      page2,
      page3,
      page4,
      { id: 5, pageNumber: 4, pageType: PlanSheetType.TITLE },
    ]);
    expect(updatedState.v1.activePageNumbers).toStrictEqual({
      ...initialState.v1.activePageNumbers,
      [PlanSheetType.TITLE]: 4,
    });
    expect(updatedState.v1.diagramIdToMove).toBeUndefined();
    expect(updatedState.v1.hasChanges).toBe(true);
  });

  it("can move a diagram to a new page after this one", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new page after this one"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    expect(updatedState.v1.diagrams[1]).toStrictEqual(diagram2);
    expect(updatedState.v1.diagrams[0]?.pageRef).toBe(6);
    expect(updatedState.v1.diagrams[0]?.originPageOffset).toStrictEqual({ x: 0.015, y: -0.015 });
    expect(updatedState.v1.diagrams[0]?.zoomScale).toBe(diagram1.zoomScale);
    expect(updatedState.v1.diagrams[0]?.bottomRightPoint).toStrictEqual(diagram1.bottomRightPoint);

    expect(updatedState.v1.pages).toStrictEqual([
      page1,
      { ...page2, pageNumber: 3 },
      { ...page3, pageNumber: 4 },
      { id: 6, pageNumber: 2, pageType: PlanSheetType.TITLE },
      page4,
    ]);
    expect(updatedState.v1.activePageNumbers).toStrictEqual({
      ...initialState.v1.activePageNumbers,
      [PlanSheetType.TITLE]: 2,
    });
    expect(updatedState.v1.diagramIdToMove).toBeUndefined();
    expect(updatedState.v1.hasChanges).toBe(true);
  });

  it("can move a diagram to a new first page", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new first page"));
    fireEvent.click(screen.getByText("Continue"));

    const updatedState = store.getState().planSheets;
    expect(updatedState.v1.diagrams[1]).toStrictEqual(diagram2);
    expect(updatedState.v1.diagrams[0]?.pageRef).toBe(5);
    expect(updatedState.v1.diagrams[0]?.originPageOffset).toStrictEqual({ x: 0.015, y: -0.015 });
    expect(updatedState.v1.diagrams[0]?.zoomScale).toBe(diagram1.zoomScale);
    expect(updatedState.v1.diagrams[0]?.bottomRightPoint).toStrictEqual(diagram1.bottomRightPoint);

    expect(updatedState.v1.pages).toStrictEqual([
      { id: 5, pageNumber: 1, pageType: PlanSheetType.TITLE },
      { ...page1, pageNumber: 2 },
      { ...page2, pageNumber: 3 },
      { ...page3, pageNumber: 4 },
      page4,
    ]);
    expect(updatedState.v1.activePageNumbers).toStrictEqual({
      ...initialState.v1.activePageNumbers,
      [PlanSheetType.TITLE]: 1,
    });
    expect(updatedState.v1.diagramIdToMove).toBeUndefined();
    expect(updatedState.v1.hasChanges).toBe(true);
  });

  it("only unsets the diagram to move when cancel is clicked", async () => {
    const { store } = renderWithReduxProvider(<MoveDiagramToPageModal diagramId={diagramIdToMove} />, {
      preloadedState: { planSheets: initialState },
    });
    fireEvent.click(await screen.findByLabelText("A new first page"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(store.getState().planSheets.v1).toStrictEqual({
      ...initialState.v1,
      diagramIdToMove: undefined,
    });
  });
});
