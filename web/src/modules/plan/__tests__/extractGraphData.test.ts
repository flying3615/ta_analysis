import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData.ts";

describe("extractGraphData", () => {
  test("extractNodes extracts node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);
    expect(extractedNodes).toHaveLength(30); // 15 mark nodes + 6 labels one symbol label (we don’t extract if the label type is not user-defined)
    const extractedNodeMap = Object.fromEntries(extractedNodes.map((n) => [n.id, n]));
    const node10001 = extractedNodeMap["10001"];
    expect(node10001?.id).toBe("10001");
    expect(node10001?.position).toStrictEqual({ x: 20, y: -10 });
    expect(node10001?.properties?.["diagramId"]).toBe(1);
    expect(node10001?.properties?.["elementType"]).toBe("coordinates");

    const node10002 = extractedNodeMap["10002"];
    expect(node10002?.id).toBe("10002");
    expect(node10002?.position).toStrictEqual({ x: 50, y: -10 });
    expect(node10002?.properties?.["diagramId"]).toBe(1);
    expect(node10002?.properties?.["elementType"]).toBe("coordinates");

    const node10003 = extractedNodeMap["10003"];
    expect(node10003?.id).toBe("10003");
    expect(node10003?.position).toStrictEqual({ x: 80, y: -10 });
    expect(node10003?.properties?.["diagramId"]).toBe(1);
    expect(node10003?.properties?.["elementType"]).toBe("coordinates");
  });

  test("extractNodes extracts label node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);

    expect(extractedNodes).toHaveLength(30); // 5 labels after mark nodes in first diagram
    const extractedNodeMap = Object.fromEntries(extractedNodes.map((n) => [n.id, n]));

    const labelNode11 = extractedNodeMap["11"];
    expect(labelNode11?.id).toBe("11");
    expect(labelNode11?.label).toBe("Label 11");
    expect(labelNode11?.position).toStrictEqual({ x: 55, y: -10 });
    expect(labelNode11?.properties?.["diagramId"]).toBe(1);
    expect(labelNode11?.properties?.["elementType"]).toBe("coordinateLabels");
    expect(labelNode11?.properties?.["labelType"]).toBe("display");
    expect(labelNode11?.properties?.["featureId"]).toBe(10001);
    expect(labelNode11?.properties?.["featureType"]).toBe("mark");
    expect(labelNode11?.properties?.["font"]).toBe("Times New Roman");
    expect(labelNode11?.properties?.["fontSize"]).toBe(10);
    expect(labelNode11?.properties?.["symbolId"]).toBeUndefined();
    expect(labelNode11?.properties?.["circled"]).toBeFalsy();
    expect(labelNode11?.properties?.["textBackgroundOpacity"]).toBe(0);

    const labelNode12 = extractedNodeMap["12"];
    expect(labelNode12?.id).toBe("12");
    expect(labelNode12?.label).toBe("96");
    expect(labelNode12?.position).toStrictEqual({ x: 20, y: -10 });
    expect(labelNode12?.properties?.["diagramId"]).toBe(1);
    expect(labelNode12?.properties?.["elementType"]).toBe("coordinateLabels");
    expect(labelNode12?.properties?.["labelType"]).toBe("display");
    expect(labelNode12?.properties?.["featureId"]).toBeUndefined();
    expect(labelNode12?.properties?.["featureType"]).toBeUndefined();
    expect(labelNode12?.properties?.["fontSize"]).toBe(10);
    expect(labelNode12?.properties?.["symbolId"]).toBe("96");

    const labelNode13 = extractedNodeMap["13"];
    expect(labelNode13?.id).toBe("13");
    expect(labelNode13?.label).toBe("Label 13");
    expect(labelNode13?.position).toStrictEqual({ x: 52, y: -40 });
    expect(labelNode13?.properties?.["diagramId"]).toBe(1);
    expect(labelNode13?.properties?.["elementType"]).toBe("lineLabels");
    expect(labelNode13?.properties?.["labelType"]).toBe("display");
    expect(labelNode13?.properties?.["featureId"]).toBe(1001);
    expect(labelNode13?.properties?.["featureType"]).toBe("line");
    expect(labelNode13?.properties?.["font"]).toBe("Arial");
    expect(labelNode13?.properties?.["fontColor"]).not.toBe("black");
    expect(labelNode13?.properties?.["fontSize"]).toBe(14);
    expect(labelNode13?.properties?.["circled"]).toBeFalsy();
    expect(labelNode13?.properties?.["textBackgroundOpacity"]).toBe(0);

    const labelNode14 = extractedNodeMap["14"];
    expect(labelNode14?.id).toBe("14");
    expect(labelNode14?.label).toBe("Label 14");
    expect(labelNode14?.position).toStrictEqual({ x: 35, y: -35 });
    expect(labelNode14?.properties?.["diagramId"]).toBe(1);
    expect(labelNode14?.properties?.["elementType"]).toBe("parcelLabels");
    expect(labelNode14?.properties?.["labelType"]).toBe("display");
    expect(labelNode14?.properties?.["featureId"]).toBe(1);
    expect(labelNode14?.properties?.["featureType"]).toBe("parcel");
    expect(labelNode14?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode14?.properties?.["fontSize"]).toBe(16);
    expect(labelNode14?.properties?.["symbolId"]).toBeUndefined();

    const labelNode23 = extractedNodeMap["23"];
    expect(labelNode23?.id).toBe("23");
    expect(labelNode23?.label).toBe("A");
    expect(labelNode23?.position).toStrictEqual({ x: 20, y: -35 });
    expect(labelNode23?.properties?.["labelType"]).toBe("display");
    expect(labelNode23?.properties?.["featureId"]).toBe(1);
    expect(labelNode23?.properties?.["featureType"]).toBe("parcel");
    expect(labelNode23?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode23?.properties?.["fontColor"]).toBe("#B0B0F0");
    expect(labelNode23?.properties?.["fontSize"]).toBe(14);
    expect(labelNode23?.properties?.["circled"]).toBeTruthy();
    expect(labelNode23?.properties?.["textBackgroundOpacity"]).toBe(1);
  });

  test("extractEdges extracts edge data", () => {
    const extractedEdges = extractDiagramEdges(mockPlanData.diagrams);
    expect(extractedEdges).toHaveLength(23);
    const extractedEdgeMap = Object.fromEntries(extractedEdges.map((n) => [n.id, n]));

    expect(extractedEdgeMap["1001"]?.id).toBe("1001");
    expect(extractedEdgeMap["1001"]?.sourceNodeId).toBe("40001");
    expect(extractedEdgeMap["1001"]?.destNodeId).toBe("40002");
    expect(extractedEdgeMap["1001"]?.properties?.["diagramId"]).toBe(2);
    expect(extractedEdgeMap["1001"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1001"]?.properties?.["pointWidth"]).toBe(1.0);

    expect(extractedEdgeMap["1002"]?.id).toBe("1002");
    expect(extractedEdgeMap["1002"]?.sourceNodeId).toBe("10002");
    expect(extractedEdgeMap["1002"]?.destNodeId).toBe("10003");
    expect(extractedEdgeMap["1002"]?.properties?.["diagramId"]).toBe(1);
    expect(extractedEdgeMap["1002"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1002"]?.properties?.["pointWidth"]).toBe(1.0);

    expect(extractedEdgeMap["1003"]?.id).toBe("1003");
    expect(extractedEdgeMap["1003"]?.sourceNodeId).toBe("40002");
    expect(extractedEdgeMap["1003"]?.destNodeId).toBe("40003");
    expect(extractedEdgeMap["1003"]?.properties?.["diagramId"]).toBe(2);
    expect(extractedEdgeMap["1003"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1003"]?.properties?.["pointWidth"]).toBe(1.0);
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
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

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
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

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
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      expect(nodes).toHaveLength(2);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(1.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
      expect(edge?.properties?.["dashPattern"]).toStrictEqual([1, 2]);
    });

    test("Styles with `arrow1`", () => {
      const diagrams = makeStyledLineDiagram("arrow1");
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(2);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties).not.toContain("sourceArrowShape");
    });

    test("Styles with `doubleArrow1`", () => {
      const diagrams = makeStyledLineDiagram("doubleArrow1");
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(2);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties?.["sourceArrowShape"]).toBe("triangle");
    });
  });
});
