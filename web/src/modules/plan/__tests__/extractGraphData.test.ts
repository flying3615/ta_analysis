import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { PlanDataBuilder } from "@/mocks/data/PlanDataBuilder.ts";

describe("extractGraphData", () => {
  test("extractNodes extracts node data", () => {
    const extractedNodes = extractNodes(mockPlanData.diagrams);

    expect(extractedNodes).toHaveLength(22); // 15 mark nodes + 7 labels
    const node10001 = extractedNodes[0];
    expect(node10001?.id).toBe("10001");
    expect(node10001?.position).toStrictEqual({ x: 20, y: -10 });
    expect(node10001?.diagramIndex).toBe(0);

    const node10002 = extractedNodes[1];
    expect(node10002?.id).toBe("10002");
    expect(node10002?.position).toStrictEqual({ x: 50, y: -10 });
    expect(node10002?.diagramIndex).toBe(0);

    const node10003 = extractedNodes[2];
    expect(node10003?.id).toBe("10003");
    expect(node10003?.position).toStrictEqual({ x: 80, y: -10 });
    expect(node10003?.diagramIndex).toBe(0);
  });

  test("extractNodes extracts label node data", () => {
    const extractedNodes = extractNodes(mockPlanData.diagrams);

    expect(extractedNodes).toHaveLength(22); // 4 labels after mark nodes in first diagram
    console.log(JSON.stringify(extractedNodes));

    const labelNode10 = extractedNodes[10];
    expect(labelNode10?.id).toBe("1");
    expect(labelNode10?.label).toBe("System Generated Primary Diagram");
    expect(labelNode10?.position).toStrictEqual({ x: 50, y: -5 });
    expect(labelNode10?.diagramIndex).toBe(0);
    expect(labelNode10?.properties?.["labelType"]).toBe("diagram");
    expect(labelNode10?.properties?.["featureId"]).toBeUndefined();
    expect(labelNode10?.properties?.["featureType"]).toBeUndefined();
    expect(labelNode10?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode10?.properties?.["fontSize"]).toBe(14);

    const labelNode11 = extractedNodes[11];
    expect(labelNode11?.id).toBe("11");
    expect(labelNode11?.label).toBe("Label 11");
    expect(labelNode11?.position).toStrictEqual({ x: 55, y: -10 });
    expect(labelNode11?.diagramIndex).toBe(0);
    expect(labelNode11?.properties?.["labelType"]).toBe("display");
    expect(labelNode11?.properties?.["featureId"]).toBe(10001);
    expect(labelNode11?.properties?.["featureType"]).toBe("mark");
    expect(labelNode11?.properties?.["font"]).toBe("Times New Roman");
    expect(labelNode11?.properties?.["fontSize"]).toBe(10);

    const labelNode12 = extractedNodes[12];
    expect(labelNode12?.id).toBe("12");
    expect(labelNode12?.label).toBe("Label 12");
    expect(labelNode12?.position).toStrictEqual({ x: 52, y: -40 });
    expect(labelNode12?.diagramIndex).toBe(0);
    expect(labelNode12?.properties?.["labelType"]).toBe("display");
    expect(labelNode12?.properties?.["featureId"]).toBe(1001);
    expect(labelNode12?.properties?.["featureType"]).toBe("line");
    expect(labelNode12?.properties?.["font"]).toBe("Arial");
    expect(labelNode12?.properties?.["fontSize"]).toBe(14);

    const labelNode13 = extractedNodes[13];
    expect(labelNode13?.id).toBe("13");
    expect(labelNode13?.label).toBe("Label 13");
    expect(labelNode13?.position).toStrictEqual({ x: 35, y: -35 });
    expect(labelNode13?.diagramIndex).toBe(0);
    expect(labelNode13?.properties?.["labelType"]).toBe("display");
    expect(labelNode13?.properties?.["featureId"]).toBe(1);
    expect(labelNode13?.properties?.["featureType"]).toBe("parcel");
    expect(labelNode13?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode13?.properties?.["fontSize"]).toBe(16);
  });

  test("extractEdges extracts edge data", () => {
    const extractedEdges = extractEdges(mockPlanData.diagrams);

    expect(extractedEdges).toHaveLength(15);
    expect(extractedEdges[0]?.id).toBe("1001");
    expect(extractedEdges[0]?.sourceNodeId).toBe("10001");
    expect(extractedEdges[0]?.destNodeId).toBe("10002");
    expect(extractedEdges[0]?.diagramIndex).toBe(0);
    expect(extractedEdges[0]?.properties?.["pointWidth"]).toBe(0.75);

    expect(extractedEdges[1]?.id).toBe("1002");
    expect(extractedEdges[1]?.sourceNodeId).toBe("10002");
    expect(extractedEdges[1]?.destNodeId).toBe("10003");
    expect(extractedEdges[1]?.diagramIndex).toBe(0);
    expect(extractedEdges[1]?.properties?.["pointWidth"]).toBe(1.0);

    expect(extractedEdges[2]?.id).toBe("1003");
    expect(extractedEdges[2]?.sourceNodeId).toBe("10003");
    expect(extractedEdges[2]?.destNodeId).toBe("10004");
    expect(extractedEdges[2]?.diagramIndex).toBe(0);
    expect(extractedEdges[2]?.properties?.["pointWidth"]).toBe(4.0);
  });

  describe("For styled lines", () => {
    const lineStart = { x: 20, y: -50 };
    const lineEnd = { x: 80, y: -110 };

    const makeStyledLineDiagram = (style: string, pointWidth: number = 1.0) => {
      return new PlanDataBuilder()
        .addDiagram({ x: 0, y: -100 })
        .addCooordinate(1, lineStart)
        .addCooordinate(2, lineEnd)
        .addLine(10, [1, 2], pointWidth, "observation", style)
        .build().diagrams;
    };

    test("Styles with `peck1`", () => {
      const diagrams = makeStyledLineDiagram("peck1", 2.0);
      const nodes = extractNodes(diagrams);
      const [edge] = extractEdges(diagrams);

      // Two nodes, dashed pattern
      expect(nodes).toHaveLength(2);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(2.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
      // 3px on, 3px off, not scaled to line width
      expect(edge?.properties?.["dashPattern"]).toStrictEqual([3, 6]);
    });

    test("Styles with `dot1`", () => {
      const diagrams = makeStyledLineDiagram("dot1", 2.0);
      const nodes = extractNodes(diagrams);
      const [edge] = extractEdges(diagrams);

      // Two nodes, dot pattern
      expect(nodes).toHaveLength(2);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(2.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
      // Scaled to line width
      expect(edge?.properties?.["dashPattern"]).toStrictEqual([2, 4]);
    });

    test("Styles with `dot2` as `dot1`", () => {
      const diagrams = makeStyledLineDiagram("dot2");
      const nodes = extractNodes(diagrams);
      const [edge] = extractEdges(diagrams);

      expect(nodes).toHaveLength(2);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(1.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
      expect(edge?.properties?.["dashPattern"]).toStrictEqual([1, 2]);
    });

    test("Styles with `arrow1`", () => {
      const diagrams = makeStyledLineDiagram("arrow1");
      const nodes = extractNodes(diagrams);
      const [edge] = extractEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(2);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties).not.toContain("sourceArrowShape");
    });

    test("Styles with `doubleArrow1`", () => {
      const diagrams = makeStyledLineDiagram("doubleArrow1");
      const nodes = extractNodes(diagrams);
      const [edge] = extractEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(2);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties?.["sourceArrowShape"]).toBe("triangle");
    });
  });
});
