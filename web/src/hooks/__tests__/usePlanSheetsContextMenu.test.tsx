import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

import { MenuItem } from "@/components/CytoscapeCanvas/CytoscapeMenu";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { usePlanSheetsContextMenu } from "@/hooks/usePlanSheetsContextMenu";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { renderWithReduxProvider } from "@/test-utils/jest-utils";
import { mockStoreV1, modifiedStateV1 } from "@/test-utils/store-mock";

describe("PlanSheetsContextMenu", () => {
  const mockedStateForPlanMode = (
    planMode: PlanMode,
    previousDiagramAttributesMap: Record<number, PreviousDiagramAttributes> = {},
  ) => {
    return {
      preloadedState: {
        ...mockStoreV1,
        planSheets: modifiedStateV1({
          ...mockStoreV1.planSheets.v1,
          diagrams: mockPlanData.diagrams,
          pages: mockPlanData.pages,
          configs: [],
          planMode: planMode,
          previousDiagramAttributesMap,
          previousDiagrams: null,
          previousPages: null,
        }),
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
    const menuItems = getMenuItemsForPlanElement(props.targetElement, { x: 10, y: 10 }, props.selectedCollection);
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
          expect(diagramMenuItems?.map((m) => m.title)).toStrictEqual(["Move to page"]);
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
    const coordinateLabel = state.preloadedState.planSheets.v1.diagrams[0]?.coordinateLabels.find((c) => c.id === 12);
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

  test("getMenuItemsForPlanMode for Select diagram line returns line menu", () => {
    const mockNode = {
      data: (key: string) => ({ id: "1001", lineType: "observation", elementType: PlanElementType.LINES })[key],
      source: () => ({ id: () => ({ id: "1" }) }),
      target: () => ({ id: () => ({ id: "2" }) }),
    } as unknown as EdgeSingular;
    const selectedElements = [mockNode];

    const selectedCollectionReturnValue = {
      size: () => selectedElements.length,
      edges: () => selectedElements,
    } as unknown as CollectionReturnValue;

    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        targetElement={mockNode}
        selectedCollection={selectedCollectionReturnValue}
        expectations={(lineMenuItems) => {
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
            "Original location",
            "Hide",
            "Properties",
            "Cut",
            "Copy",
            "Paste",
            "Delete",
          ]);
          expect(lineMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
        }}
      />,
      mockedStateForPlanMode(PlanMode.SelectLine),
    );
  });

  test(
    "getMenuItemsForPlanMode for Select page line shows disabled Original location option and enabled Delete " +
      "option when line is userDefined",
    () => {
      const mockNode = {
        data: (key: string) => ({ id: "1001", lineType: "userDefined", elementType: PlanElementType.LINES })[key],
        source: () => ({ id: () => ({ id: "1" }) }),
        target: () => ({ id: () => ({ id: "2" }) }),
      } as unknown as EdgeSingular;
      const selectedElements = [mockNode];

      const selectedCollectionReturnValue = {
        size: () => selectedElements.length,
        edges: () => selectedElements,
      } as unknown as CollectionReturnValue;

      renderWithReduxProvider(
        <PlanSheetsContextMenuWrapComponent
          selectedCollection={selectedCollectionReturnValue}
          targetElement={mockNode}
          expectations={(lineMenuItems) => {
            expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
              "Original location",
              "Hide",
              "Properties",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(lineMenuItems?.find((item) => item.title === "Original location")?.disabled).toBeTruthy();
            expect(lineMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeFalsy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLine),
      );
    },
  );

  test("getMenuItemsForPlanMode for Select line disables hide option when line is systemDisplay", () => {
    const mockNode = {
      data: (key: string) =>
        ({ id: "1001", elementType: PlanElementType.LINES, displayState: DisplayStateEnum.systemDisplay })[key],
      source: () => ({ id: () => ({ id: "1" }) }),
      target: () => ({ id: () => ({ id: "2" }) }),
    } as unknown as EdgeSingular;

    const selectedElements = [mockNode];

    const selectedCollectionReturnValue = {
      size: () => selectedElements.length,
      edges: () => selectedElements,
    } as unknown as CollectionReturnValue;

    renderWithReduxProvider(
      <PlanSheetsContextMenuWrapComponent
        selectedCollection={selectedCollectionReturnValue}
        targetElement={mockNode}
        expectations={(lineMenuItems) => {
          expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
            "Original location",
            "Hide",
            "Properties",
            "Cut",
            "Copy",
            "Paste",
            "Delete",
          ]);
          expect(lineMenuItems?.find((item) => item.title === "Hide")?.disabled).toBeTruthy();
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
    test("for single page label selection menu (hide)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.hide,
            })[key],
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
              "Align label to line",
              "Rotate label",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeFalsy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for multiple page label selection menu (both display)", (/**/) => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.display,
            })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({
              id: "1002",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.display,
            })[key],
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
              "Hide",
              "Properties",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeFalsy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for single diagram label selection menu (display)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LINE_LABELS,
              labelType: LabelDTOLabelTypeEnum.lineDescription,
              displayState: DisplayStateEnum.display,
            })[key],
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
              "Hide",
              "Properties",
              "Align label to line",
              "Rotate label",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for multiple diagram label selection menu (both hide)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.COORDINATE_LABELS,
              labelType: LabelDTOLabelTypeEnum.markName,
              displayState: DisplayStateEnum.hide,
            })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({
              id: "1002",
              elementType: PlanElementType.LINE_LABELS,
              labelType: LabelDTOLabelTypeEnum.lineDescription,
              displayState: DisplayStateEnum.hide,
            })[key],
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
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for combination label selection menu (hide, display)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;

      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.hide,
            })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({
              id: "1002",
              elementType: PlanElementType.LINE_LABELS,
              labelType: LabelDTOLabelTypeEnum.lineDescription,
              displayState: DisplayStateEnum.display,
            })[key],
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
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for combination label selection menu (system display, display)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;
      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.systemDisplay,
            })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({
              id: "1002",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.lineDescription,
              displayState: DisplayStateEnum.display,
            })[key],
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
              "Hide",
              "Properties",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for combination label selection menu (system display, hide)", () => {
      const mockNode = {
        data: (key: string) =>
          ({ id: "1001", elementType: PlanElementType.LABELS, displayState: DisplayStateEnum.systemDisplay })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;
      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.userAnnotation,
              displayState: DisplayStateEnum.systemDisplay,
            })[key],
        } as NodeSingular,
        {
          data: (key: string) =>
            ({
              id: "1002",
              elementType: PlanElementType.LABELS,
              labelType: LabelDTOLabelTypeEnum.lineDescription,
              displayState: DisplayStateEnum.hide,
            })[key],
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
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });

    test("for single diagram label (system display)", () => {
      const mockNode = {
        data: (key: string) =>
          ({
            id: "1001",
            elementType: PlanElementType.CHILD_DIAGRAM_LABELS,
            displayState: DisplayStateEnum.systemDisplay,
          })[key],
        cy: () => undefined,
        removeClass: () => undefined,
      } as unknown as NodeSingular;
      const selectedElements = [
        {
          data: (key: string) =>
            ({
              id: "1001",
              elementType: PlanElementType.CHILD_DIAGRAM_LABELS,
              labelType: LabelDTOLabelTypeEnum.childDiagram,
              displayState: DisplayStateEnum.systemDisplay,
            })[key],
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
              "Align label to line",
              "Rotate label",
              "Cut",
              "Copy",
              "Paste",
              "Delete",
            ]);
            expect(labelMenuItems?.find((item) => item.title === "Delete")?.disabled).toBeTruthy();
            expect(labelMenuItems?.find((item) => item.title === "Show")?.disabled).toBeTruthy();
          }}
        />,
        mockedStateForPlanMode(PlanMode.SelectLabel),
      );
    });
  });
});
