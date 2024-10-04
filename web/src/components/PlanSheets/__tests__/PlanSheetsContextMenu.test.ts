import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { NodeSingular } from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { getMenuItemsForPlanElement } from "@/components/PlanSheets/PlanSheetsContextMenu.tsx";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { LookupGraphData } from "@/modules/plan/LookupGraphData.ts";

describe("PlanSheetsContextMenu", () => {
  test("getMenuItemsForPlanMode for Select diagram returns diagram menu", () => {
    const lookupGraphData = new LookupGraphData(mockPlanData);
    const diagramMenuItems = getMenuItemsForPlanElement(lookupGraphData, PlanMode.SelectDiagram, {
      data: (key: string) => ({ id: "D1", elementType: PlanElementType.DIAGRAM })[key],
    } as unknown as NodeSingular);

    expect(diagramMenuItems?.map((m) => m.title)).toStrictEqual([
      "Properties",
      "Cut",
      "Copy",
      "Paste",
      "Move to page...",
    ]);
  });

  test("getMenuItemsForPlanMode for Select coordinate returns coordinate menu", () => {
    const lookupGraphData = new LookupGraphData(mockPlanData);
    const coordinateMenuItems = getMenuItemsForPlanElement(lookupGraphData, PlanMode.SelectCoordinates, {
      data: (key: string) => ({ id: "10001", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular);

    expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual([
      "Original location",
      "Hide",
      "Properties",
      "Cut",
      "Copy",
      "Paste",
    ]);
  });

  test("getMenuItemsForPlanMode for Select coordinate returns Show option when mark symbol hidden", () => {
    const planData = {
      ...mockPlanData,
    };
    const lookupGraphData = new LookupGraphData(mockPlanData);
    const coordinateLabel = planData.diagrams[0]?.coordinateLabels.find((c) => c.id === 12);
    coordinateLabel!.displayState = DisplayStateEnum.hide;

    const coordinateMenuItems = getMenuItemsForPlanElement(lookupGraphData, PlanMode.SelectCoordinates, {
      data: (key: string) => ({ id: "10001", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular);

    expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual([
      "Original location",
      "Show",
      "Properties",
      "Cut",
      "Copy",
      "Paste",
    ]);
  });

  test("getMenuItemsForPlanMode for Select line returns line menu", () => {
    const lookupGraphData = new LookupGraphData(mockPlanData);
    const lineMenuItems = getMenuItemsForPlanElement(lookupGraphData, PlanMode.SelectLine, {
      data: (key: string) => ({ id: "1001", elementType: PlanElementType.LINES })[key],
    } as unknown as NodeSingular);

    expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
      "Original location",
      "Show",
      "Properties",
      "Cut",
      "Copy",
      "Paste",
      "Select",
    ]);
  });

  test("getMenuItemsForPlanMode for Select line disables line menu when line is systemDisplay", () => {
    const lookupGraphData = new LookupGraphData(mockPlanData);
    const lineMenuItems = getMenuItemsForPlanElement(lookupGraphData, PlanMode.SelectLine, {
      data: (key: string) =>
        ({ id: "1001", elementType: PlanElementType.LINES, displayState: DisplayStateEnum.systemDisplay })[key],
    } as unknown as NodeSingular);

    expect(lineMenuItems?.map((m) => m.title)).toStrictEqual([
      "Original location",
      "Hide",
      "Properties",
      "Cut",
      "Copy",
      "Paste",
      "Select",
    ]);
    expect(lineMenuItems?.[1]?.disabled).toBeTruthy();
  });
});
