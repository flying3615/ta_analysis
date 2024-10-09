import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue, NodeSingular } from "cytoscape";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu.tsx";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import { usePlanSheetsContextMenu } from "@/hooks/usePlanSheetsContextMenu.tsx";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { renderWithReduxProvider } from "@/test-utils/jest-utils.tsx";
import { mockStore } from "@/test-utils/store-mock.ts";

describe("PlanSheetsContextMenu", () => {
  const mockedStateForPlanMode = (planMode: PlanMode) => {
    return {
      preloadedState: {
        ...mockStore,
        planSheets: {
          ...mockStore.planSheets,
          diagrams: mockPlanData.diagrams,
          pages: mockPlanData.pages,
          configs: [],
          planMode: planMode,
        },
      },
    };
  };

  interface PlanSheetsContextMenuWrapProps {
    targetElement: cytoscape.NodeSingular | cytoscape.EdgeSingular | cytoscape.Core | undefined;
    selectedCollection?: CollectionReturnValue;
    expectations: (menuItems: MenuItem[]) => void;
  }

  const PlanSheetsContextMenuWrapComponent = (props: PlanSheetsContextMenuWrapProps) => {
    const getMenuItemsForPlanElement = usePlanSheetsContextMenu();
    const menuItems = getMenuItemsForPlanElement(props.targetElement, props.selectedCollection);
    props.expectations(menuItems);
    return <></>;
  };

  test("getMenuItemsForPlanMode for Select diagram returns diagram menu", () => {
    const mockNode = {
      data: (key: string) => ({ id: "D1", elementType: PlanElementType.DIAGRAM })[key],
    } as unknown as NodeSingular;

    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(diagramMenuItems) => {
          expect(diagramMenuItems?.map((m) => m.title)).toStrictEqual([
            "Properties",
            "Cut",
            "Copy",
            "Paste",
            "Move to page...",
          ]);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectDiagram),
    );
  });

  test("getMenuItemsForPlanMode for Select coordinate returns coordinate menu", () => {
    const mockNode = {
      data: (key: string) => ({ id: "10001", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(coordinateMenuItems) => {
          expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Hide"]);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectCoordinates),
    );
  });

  test("getMenuItemsForPlanMode for Select coordinate returns Show option when mark symbol hidden", () => {
    const mockNode = {
      data: (key: string) => ({ id: "10001", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular;
    const state = mockedStateForPlanMode(PlanMode.SelectCoordinates);
    const coordinateLabel = state.preloadedState.planSheets.diagrams[0]?.coordinateLabels.find((c) => c.id === 12);
    coordinateLabel!.displayState = DisplayStateEnum.hide;

    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(coordinateMenuItems) => {
          expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Show"]);
        }}
      />,
      state,
    );
  });

  test("getMenuItemsForPlanMode for Select coordinate disables Show option for user defined line end nodes", () => {
    const mockNode = {
      data: (key: string) => ({ id: "10011", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular;

    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(coordinateMenuItems) => {
          expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Show"]);
          expect(coordinateMenuItems?.[1]?.disabled).toBeTruthy();
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectCoordinates),
    );
  });

  test("getMenuItemsForPlanMode for Select line returns line menu", () => {
    const mockNode = {
      data: (key: string) => ({ id: "1001", elementType: PlanElementType.LINES })[key],
    } as unknown as NodeSingular;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(lineMenuItems) => {
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Show"]);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectLine),
    );
  });

  test("getMenuItemsForPlanMode for Select line disables hide option when line is systemDisplay", () => {
    const mockNode = {
      data: (key: string) =>
        ({ id: "1001", elementType: PlanElementType.LINES, displayState: DisplayStateEnum.systemDisplay })[key],
    } as unknown as NodeSingular;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(lineMenuItems) => {
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Hide"]);
          expect(lineMenuItems?.[1]?.disabled).toBeTruthy();
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectLine),
    );
  });

  describe("getMenuItemsForPlanMode for Select Label", () => {
    test("for single page label selection menu", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={mockNode}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Rotate label",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
              "Align label to line",
            ]);
            expect(labelMenuItems?.[9]?.disabled).toBeFalsy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for multiple page label selection menu", (/**/) => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({ id: "1002", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={mockNode}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.[8]?.disabled).toBeFalsy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for single diagram label selection menu", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.lineDescription })[
              key
            ],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={mockNode}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Rotate label",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
              "Align label to line",
            ]);
            expect(labelMenuItems?.[9]?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for multiple diagram label selection menu", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.markName })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({ id: "1002", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.lineDescription })[
              key
            ],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={mockNode}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.[8]?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for combination label selection menu", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({ id: "1002", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.lineDescription })[
              key
            ],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={mockNode}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.[8]?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for combination label selection menu while click elsewhere", () => {
      const selectedElements = [
        {
          data: (key: string) =>
            ({ id: "1001", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({ id: "1002", elementType: PlanElementType.LABELS, labelType: LabelDTOLabelTypeEnum.lineDescription })[
              key
            ],
        } as NodeSingular,
      ];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        nodes: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          targetElement={undefined}
          selectedCollection={selectedCollectionReturnValue}
          expectations={(labelMenuItems) => {
            expect(labelMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Show",
              "Properties",
              "Select",
              "Move to page...",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.[8]?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });
  });
});
