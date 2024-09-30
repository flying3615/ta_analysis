import { NodeSingular } from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { getMenuItemsForPlanMode } from "@/components/PlanSheets/PlanSheetsContextMenu.ts";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType.ts";

describe("PlanSheetsContextMenu", () => {
  test("getMenuItemsForPlanMode for Select diagram returns diagram menu", () => {
    const diagramMenuItems = getMenuItemsForPlanMode(PlanMode.SelectDiagram, {
      data: (key: string) => ({ id: "D1", elementType: PlanElementType.DIAGRAM })[key],
    } as unknown as NodeSingular);

    expect(diagramMenuItems?.map((m) => m.title)).toStrictEqual(["Properties", "Move To Page..."]);
  });

  test("getMenuItemsForPlanMode for Select coordinate returns coordinate menu", () => {
    const coordinateMenuItems = getMenuItemsForPlanMode(PlanMode.SelectCoordinates, {
      data: (key: string) => ({ id: "1001", elementType: PlanElementType.COORDINATES })[key],
    } as unknown as NodeSingular);

    expect(coordinateMenuItems?.map((m) => m.title)).toStrictEqual(["Original Location", "Show", "Properties"]);
  });

  test("getMenuItemsForPlanMode for Select line returns line menu", () => {
    const lineMenuItems = getMenuItemsForPlanMode(PlanMode.SelectLine, {
      data: (key: string) => ({ id: "200", elementType: PlanElementType.LINES })[key],
    } as unknown as NodeSingular);

    expect(lineMenuItems?.map((m) => m.title)).toStrictEqual(["Original Location", "Properties", "Select"]);
  });
});
