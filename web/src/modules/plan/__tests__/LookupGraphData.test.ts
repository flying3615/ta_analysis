import { CoordinateDTO, DiagramDTO, LabelDTO, LineDTO } from "@linz/survey-plan-generation-api-client";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { LookupGraphData } from "@/modules/plan/LookupGraphData.ts";

const lookupGraphData = new LookupGraphData(mockPlanData);

describe("lookupSource", () => {
  test("finds a user coordinate by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.COORDINATES, "10012");
    expect(result?.resultType).toBe("CoordinateDTO");
    expect(result?.result.id).toBe(10012);
    expect((result?.result as CoordinateDTO).position.x).toBe(50);
    expect((result?.result as CoordinateDTO).position.y).toBe(-10);
  });
  test("finds a coordinate by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.COORDINATES, "10001");
    expect(result?.resultType).toBe("CoordinateDTO");
    expect(result?.result.id).toBe(10001);
    expect((result?.result as CoordinateDTO).position.x).toBe(20);
    expect((result?.result as CoordinateDTO).position.y).toBe(-10);
  });
  test("finds a diagram by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.DIAGRAM, "2");
    expect(result?.resultType).toBe("DiagramDTO");
    expect(result?.result.id).toBe(2);
    expect((result?.result as DiagramDTO).diagramType).toBe("sysGenTraverseDiag");
    expect((result?.result as DiagramDTO).pageRef).toBe(2);
  });
  test("finds a user defined line by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LINES, "10013");
    expect(result?.resultType).toBe("LineDTO");
    expect(result?.result.id).toBe(10013);
    expect((result?.result as LineDTO).lineType).toBe("userDefined");
  });
  test("finds a line by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LINES, "1001");
    expect(result?.resultType).toBe("LineDTO");
    expect(result?.result.id).toBe(1001);
    expect((result?.result as LineDTO).lineType).toBe("observation");
  });
  test("finds a line by type and id from a segment", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LINES, "1001_2");
    expect(result?.resultType).toBe("LineDTO");
    expect(result?.result.id).toBe(1001);
    expect((result?.result as LineDTO).lineType).toBe("observation");
  });
  test("finds a diagram label by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LABELS, "1");
    expect(result?.resultType).toBe("LabelDTO");
    expect(result?.result.id).toBe(1);
    expect((result?.result as LabelDTO).displayText).toBe("System Generated Primary Diagram");
  });
  test("finds a coordinate label by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LABELS, "11");
    expect(result?.resultType).toBe("LabelDTO");
    expect(result?.result.id).toBe(11);
    expect((result?.result as LabelDTO).displayText).toBe("Label 11");
  });
  test("finds a symbol label by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LABELS, "12");
    expect(result?.resultType).toBe("LabelDTO");
    expect(result?.result.id).toBe(12);
    expect((result?.result as LabelDTO).displayText).toBe("96");
  });
  test("finds a line label by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LABELS, "13");
    expect(result?.resultType).toBe("LabelDTO");
    expect(result?.result.id).toBe(13);
    expect((result?.result as LabelDTO).displayText).toBe("Label 13");
  });
  test("finds a parcel label by type and id", () => {
    const result = lookupGraphData.lookupSource(PlanElementType.LABELS, "14");
    expect(result?.resultType).toBe("LabelDTO");
    expect(result?.result.id).toBe(14);
    expect((result?.result as LabelDTO).displayText).toBe("Label 14");
  });
});

describe("findMarkSymbol", () => {
  test("finds the symbol label for a mark coordinate feature", () => {
    const markCoordinate = lookupGraphData.lookupSource(PlanElementType.COORDINATES, "10001");
    const symbolLabel = lookupGraphData.findMarkSymbol(markCoordinate);
    expect(symbolLabel?.labelType).toBe("nodeSymbol1");
    expect(symbolLabel?.displayText).toBe("96");
    expect(symbolLabel?.font).toBe("LOLsymbols");
  });
  test("finds the symbol label for a mark from the mark name", () => {
    const markNameLabel = lookupGraphData.lookupSource(PlanElementType.LABELS, "12");
    const symbolLabel = lookupGraphData.findMarkSymbol(markNameLabel);
    expect(symbolLabel?.labelType).toBe("nodeSymbol1");
    expect(symbolLabel?.displayText).toBe("96");
    expect(symbolLabel?.font).toBe("LOLsymbols");
  });
});
