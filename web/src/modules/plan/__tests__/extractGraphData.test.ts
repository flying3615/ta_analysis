import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import { extractDiagramEdges, extractDiagramNodes, extractPageNodes } from "@/modules/plan/extractGraphData.ts";
import { getLineDashPattern, LineStyle, lineStyleValues } from "@/modules/plan/styling.ts";

describe("extractGraphData", () => {
  test("extractNodes extracts node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);
    // 15 mark nodes + 6 labels one symbol label (we don’t extract if the label type is not user-defined)
    // + six synthetic nodes the broken line
    expect(extractedNodes).toHaveLength(42);
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
    // broken nodes for broken line 1007
    const node1007_M1 = extractedNodeMap["1007_M1"];
    expect(node1007_M1?.id).toBe("1007_M1");
    expect(node1007_M1?.position).toStrictEqual({ x: 50, y: -30 });
    expect(node1007_M1?.properties?.["diagramId"]).toBe(1);
    expect(node1007_M1?.properties?.["elementType"]).toBe("coordinates");

    const node1007_M2 = extractedNodeMap["1007_M2"];
    expect(node1007_M2?.id).toBe("1007_M2");
    expect(node1007_M2?.position).toStrictEqual({ x: 50, y: -50 });
    expect(node1007_M2?.properties?.["diagramId"]).toBe(1);
    expect(node1007_M2?.properties?.["elementType"]).toBe("coordinates");
  });

  test("extractNodes extracts label node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);

    expect(extractedNodes).toHaveLength(42); // 5 labels after mark nodes in first diagram
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

    const labelNode21 = extractedNodeMap["21"];
    expect(labelNode21?.id).toBe("21");
    expect(labelNode21?.label).toBe("Edited\nLine");
    expect(labelNode21?.position).toStrictEqual({ x: 85, y: -40 });
    expect(labelNode21?.properties?.["featureId"]).toBe(1001);
    expect(labelNode21?.properties?.["featureType"]).toBe("line");
    expect(labelNode21?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode21?.properties?.["fontColor"]).toBe("#2121F5");
    expect(labelNode21?.properties?.["fontSize"]).toBe(14);
    expect(labelNode21?.properties?.["circled"]).toBeFalsy();

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
    expect(extractedEdges).toHaveLength(28);
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

    //  Line 1007 is a broken line, check that it is split into two edges
    expect(extractedEdgeMap["1007_S"]?.id).toBe("1007_S");
    expect(extractedEdgeMap["1007_S"]?.sourceNodeId).toBe("10002");
    expect(extractedEdgeMap["1007_S"]?.destNodeId).toBe("1007_M1");

    expect(extractedEdgeMap["1007_E"]?.id).toBe("1007_E");
    expect(extractedEdgeMap["1007_E"]?.sourceNodeId).toBe("1007_M2");
    expect(extractedEdgeMap["1007_E"]?.destNodeId).toBe("10005");
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
      expect(nodes).toHaveLength(3);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(2.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
    });

    test("Styles with `dot1`", () => {
      const diagrams = makeStyledLineDiagram("dot1", 2.0);
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      // Two nodes, dot pattern
      expect(nodes).toHaveLength(3);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(2.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
      // Scaled to line width
    });

    test("Styles with `dot2` as `dot1`", () => {
      const diagrams = makeStyledLineDiagram("dot2");
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      expect(nodes).toHaveLength(3);
      expect(edge?.sourceNodeId).toBe("1");
      expect(edge?.destNodeId).toBe("2");
      expect(edge?.properties?.["pointWidth"]).toBe(1.0);
      expect(edge?.properties?.["dashStyle"]).toBe("dashed");
    });

    test("Styles with `arrow1`", () => {
      const diagrams = makeStyledLineDiagram("arrow1");
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(3);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties).not.toContain("sourceArrowShape");
    });

    test("Styles with `doubleArrow1`", () => {
      const diagrams = makeStyledLineDiagram("doubleArrow1");
      const nodes = extractDiagramNodes(diagrams);
      const [edge] = extractDiagramEdges(diagrams);

      // Arrow points at target (end)
      expect(nodes).toHaveLength(3);
      expect(edge?.properties?.["targetArrowShape"]).toBe("triangle");
      expect(edge?.properties?.["sourceArrowShape"]).toBe("triangle");
    });

    // check all lines styles with a dash pattern have property dashStyle defined
    it.each(Object.values(LineStyle).filter((s) => getLineDashPattern(s).length > 0))(
      "Style %s has property dashStyle as it has a dash pattern",
      (style) => {
        const lineStyle = lineStyleValues[style];
        expect(lineStyle).toHaveProperty("dashStyle");
      },
    );

    // check all lines styles without a dash pattern do not have property dashStyle defined
    it.each(Object.values(LineStyle).filter((s) => getLineDashPattern(s).length === 0))(
      "Style %s does not have property dashStyle as it has no dash pattern",
      (style) => {
        const lineStyle = lineStyleValues[style];
        expect(lineStyle).not.toHaveProperty("dashStyle");
      },
    );
  });

  test("extractPageNodes extracts user annotations", () => {
    const extractedNodes = extractPageNodes(mockPlanData.pages);
    expect(extractedNodes).toHaveLength(1);
    const userAnnotationNode = extractedNodes[0];
    expect(userAnnotationNode?.position).toStrictEqual({ x: 13, y: -13 });
    expect(userAnnotationNode?.label).toBe("Rotated user added text");
  });
});
