import { CoordinateDTO } from "@linz/survey-plan-generation-api-client";

import { INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { coordinateToNode } from "@/modules/plan/extractGraphData";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";

interface UseLabelAdjustInterface {
  useLineLabelAdjust: () => (movedNodesById: Record<number, INodeData>) => INodeData[];
}

describe("useLineLabelAdjust", () => {
  const mockPlan = new PlanDataBuilder()
    .addDiagram(
      {
        x: 80,
        y: -90,
      },
      undefined,
      "sysGenTraverseDiag",
    )
    .addCooordinate(10001, {
      x: 20,
      y: -10,
    })
    .addCooordinate(10002, {
      x: 30,
      y: -10,
    })
    .addCooordinate(10003, {
      x: 30,
      y: -20,
    })
    .addCooordinate(10004, {
      x: 10,
      y: -20,
    })
    .addLine(1001, [10001, 10002])
    .addLine(1002, [10002, 10003])
    .addLine(1003, [10003, 10004])
    .addLine(1003, [10004, 10001])
    .addLabel("lineLabels", 2001, "Line 1001", { x: 25, y: -10 }, 1001, "Line")
    .addRotatedLabel(
      "lineLabels",
      2002,
      "Line 1002",
      { x: 30, y: -15 },
      "Tahoma",
      10,
      270,
      0,
      0,
      undefined,
      1002,
      "Line",
    )
    .addRotatedLabel(
      "lineLabels",
      2003,
      "Line 1003",
      { x: 25, y: -20 },
      "Tahoma",
      10,
      0, // This is shown left to right on an east-west line
      90,
      5 / POINTS_PER_CM,
      undefined,
      1003,
      "Line",
    )
    .addRotatedLabel(
      "lineLabels",
      2004,
      "Line 1004",
      { x: 20, y: -15 },
      "Tahoma",
      10,
      45,
      0,
      0,
      undefined,
      1004,
      "Line",
    )
    .build();

  test("returns adjusted label nodes when node moved", () => {
    const useAppSelector = jest.fn().mockReturnValue(mockPlan.diagrams);
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppSelector }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useLineLabelAdjust } = require("../useLineLabelAdjust") as UseLabelAdjustInterface;

    const adjustLabelsWithLine = useLineLabelAdjust();

    const movedNode = coordinateToNode(mockPlan?.diagrams?.[0]?.coordinates[1] as CoordinateDTO);
    movedNode.position = { x: 40, y: -5 };

    const adjustedLabels = adjustLabelsWithLine({ 10002: movedNode });
    expect(adjustedLabels).toHaveLength(2);
    expect(adjustedLabels[0]?.id).toBe("LAB_2001");
    expect(adjustedLabels[0]?.position?.x).toBeCloseTo(30);
    expect(adjustedLabels[0]?.position?.y).toBeCloseTo(-7.5);
    expect(adjustedLabels[0]?.properties?.["textRotation"]).toBeCloseTo(14, 0);
    expect(adjustedLabels[0]?.properties?.["anchorAngle"]).toBeCloseTo(14, 0);
    expect(adjustedLabels[1]?.id).toBe("LAB_2002");
    expect(adjustedLabels[1]?.position?.x).toBeCloseTo(35);
    expect(adjustedLabels[1]?.position?.y).toBeCloseTo(-12.5);
    expect(adjustedLabels[1]?.properties?.["textRotation"]).toBeCloseTo(236, 0);
    expect(adjustedLabels[1]?.properties?.["anchorAngle"]).toBeCloseTo(326, 0);
  });

  test("returns adjusted label nodes when two nodes moved", () => {
    const useAppSelector = jest.fn().mockReturnValue(mockPlan.diagrams);
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppSelector }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useLineLabelAdjust } = require("../useLineLabelAdjust") as UseLabelAdjustInterface;

    const adjustLabelsWithLine = useLineLabelAdjust();

    const movedNode10002 = coordinateToNode(mockPlan?.diagrams?.[0]?.coordinates[1] as CoordinateDTO);
    const movedNode10003 = coordinateToNode(mockPlan?.diagrams?.[0]?.coordinates[2] as CoordinateDTO);
    movedNode10002.position = { x: 40, y: -5 };
    movedNode10003.position = { x: 40, y: -15 };

    const adjustedLabels = adjustLabelsWithLine({ 10003: movedNode10003, 10002: movedNode10002 });
    expect(adjustedLabels).toHaveLength(3);
    expect(adjustedLabels[0]?.id).toBe("LAB_2001");
    expect(adjustedLabels[0]?.position?.x).toBeCloseTo(30);
    expect(adjustedLabels[0]?.position?.y).toBeCloseTo(-7.5);
    expect(adjustedLabels[0]?.properties?.["textRotation"]).toBeCloseTo(14, 0);
    expect(adjustedLabels[0]?.properties?.["anchorAngle"]).toBeCloseTo(14, 0);
    expect(adjustedLabels[1]?.id).toBe("LAB_2002");
    expect(adjustedLabels[1]?.position?.x).toBeCloseTo(40);
    expect(adjustedLabels[1]?.position?.y).toBeCloseTo(-10);
    expect(adjustedLabels[1]?.properties?.["textRotation"]).toBeCloseTo(270, 0);
    expect(adjustedLabels[1]?.properties?.["anchorAngle"]).toBeCloseTo(0, 0);
    expect(adjustedLabels[2]?.id).toBe("LAB_2003");
    expect(adjustedLabels[2]?.position?.x).toBeCloseTo(30);
    expect(adjustedLabels[2]?.position?.y).toBeCloseTo(-17.5);
    expect(adjustedLabels[2]?.properties?.["textRotation"]).toBeCloseTo(9, 0);
    expect(adjustedLabels[2]?.properties?.["anchorAngle"]).toBeCloseTo(99, 0);
    expect(adjustedLabels[2]?.properties?.["pointOffset"]).toBeCloseTo(5 / POINTS_PER_CM, 0);
  });
});
