import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue, NodeSingular } from "cytoscape";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { usePlanSheetsContextMenu } from "@/hooks/usePlanSheetsContextMenu";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";

describe("PlanSheetsContextMenu", () => {
  const mockedStateForPlanMode = (
    planMode: PlanMode,
    previousDiagramAttributesMap: Record<number, PreviousDiagramAttributes> = {},
  ) => {
    return {
      preloadedState: {
        ...mockStore,
        planSheets: {
          ...mockStore.planSheets,
          diagrams: mockPlanData.diagrams,
          pages: mockPlanData.pages,
          configs: [],
          planMode: planMode,
          previousDiagramAttributesMap,
          previousDiagrams: null,
          previousPages: null,
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

  const buildMockNode = (id: string, elementType: PlanElementType, extraData: Record<string, string | number> = {}) =>
    ({
      data: (key: string | undefined) => {
        const element: Record<string, string> = { id, elementType, ...extraData };
        if (key) {
          return element[key];
        }
        return element;
      },
    }) as unknown as NodeSingular;

  test("getMenuItemsForPlanMode for Select diagram returns diagram menu", () => {
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={buildMockNode("D1", PlanElementType.DIAGRAM)}
        expectations={(diagramMenuItems) => {
          expect(diagramMenuItems?.map((m) => m.title)).toStrictEqual(["Move to page..."]);
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
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Hide", "Properties"]);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectLine),
    );
  });

  test("getMenuItemsForPlanMode for Select line shows Delete option when line is userDefined", () => {
    const mockNode = {
      data: (key: string) => ({ id: "1001", lineType: "userDefined", elementType: PlanElementType.LINES })[key],
    } as unknown as NodeSingular;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        expectations={(lineMenuItems) => {
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
            "Original location",
            "Hide",
            "Properties",
            "Delete",
          ]);
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
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual(["Original location", "Hide", "Properties"]);
          expect(lineMenuItems?.[1]?.disabled).toBeTruthy();
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectLine),
    );
  });

  test("getMenuItemsForPlanMode for Select diagram shows menu item for Affected lines", () => {
    const id = 10001;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={buildMockNode(`D${id}`, PlanElementType.DIAGRAM, { diagramId: id })}
        expectations={(diagramMenuItems) => {
          const menuItemTitles = diagramMenuItems?.map((m) => m.title);
          expect(menuItemTitles).toContain("Select lines affected by last diagram shift");
          expect(diagramMenuItems).toHaveLength(2);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectDiagram, {
        [id]: {
          id: id,
          linesAffectedByLastMove: [
            {
              id: `${1001}`,
            },
          ],
          labelsAffectedByLastMove: [],
        },
      }),
    );
  });

  test("shows diagram menu if node id is selected-diagram", () => {
    const id = 10001;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={buildMockNode("selected-diagram", PlanElementType.DIAGRAM, { diagramId: id })}
        expectations={(diagramMenuItems) => {
          const menuItemTitles = diagramMenuItems?.map((m) => m.title);
          expect(menuItemTitles).toContain("Select lines affected by last diagram shift");
          expect(menuItemTitles).toContain("Select text affected by last diagram shift");
          expect(diagramMenuItems).toHaveLength(3);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectDiagram, {
        [id]: {
          id: id,
          linesAffectedByLastMove: [
            {
              id: `${id}`,
            },
          ],
          labelsAffectedByLastMove: [
            {
              id: `${id}`,
            },
          ],
        },
      }),
    );
  });

  test("getMenuItemsForPlanMode for Select diagram shows menu item for Affected labels", () => {
    const id = 10001;
    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={buildMockNode(`D${id}`, PlanElementType.DIAGRAM, { diagramId: id })}
        expectations={(diagramMenuItems) => {
          const menuItemTitles = diagramMenuItems?.map((m) => m.title);
          expect(menuItemTitles).toContain("Select text affected by last diagram shift");
          expect(diagramMenuItems).toHaveLength(2);
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectDiagram, {
        [id]: {
          id: id,
          labelsAffectedByLastMove: [
            {
              id: `1001`,
            },
          ],
          linesAffectedByLastMove: [],
        },
      }),
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
