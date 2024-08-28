import { LineDTO } from "@linz/survey-plan-generation-api-client";

import { nestedTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { mockPlanData } from "@/mocks/data/mockPlanData.ts";
import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageNodes,
  lineToEdges,
} from "@/modules/plan/extractGraphData.ts";
import { getLineDashPattern, LineStyle, lineStyleValues } from "@/modules/plan/styling.ts";
import { IDiagramToPage } from "@/redux/planSheets/planSheetsThunk";

describe("extractGraphData", () => {
  test("extractNodes extracts node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);
    // 19 mark nodes + 6 labels one symbol label (we don’t extract if the label type is not user-defined)
    // + six synthetic nodes the broken line
    expect(extractedNodes).toHaveLength(46);
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

    expect(extractedNodes).toHaveLength(46); // 5 labels after mark nodes in first diagram
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

  test("extractDiagramNodes displays child diagram label with '?'", () => {
    const mockLookupTbl: IDiagramToPage = {};

    const diagram3 = nestedTitlePlan.diagrams.find((d) => d.id === 3);
    expect(diagram3!.childDiagrams![0]?.diagramRef).toBe(6);
    expect(diagram3!.childDiagrams![0]?.labels).toHaveLength(2);
    expect(diagram3!.childDiagrams![0]?.labels[0]?.id).toBe(41);
    expect(diagram3!.childDiagrams![0]?.labels[0]?.displayText).toBe("Diag. ACA");
    expect(diagram3!.childDiagrams![0]?.labels[1]?.id).toBe(42);
    expect(diagram3!.childDiagrams![0]?.labels[1]?.displayText).toBe("See T?");

    const extractedNodes = extractDiagramNodes(nestedTitlePlan.diagrams, mockLookupTbl);

    expect(extractedNodes).toHaveLength(26);
    const extractedNodeMap = Object.fromEntries(extractedNodes.map((n) => [n.id, n]));

    const labelNode41 = extractedNodeMap["41"];
    expect(labelNode41?.id).toBe("41");
    expect(labelNode41?.label).toBe("Diag. ACA");

    const labelNode42 = extractedNodeMap["42"];
    expect(labelNode42?.id).toBe("42");
    expect(labelNode42?.label).toBe("See T?");
  });

  test("extractDiagramNodes displays child diagram label with page number", () => {
    const mockLookupTbl: IDiagramToPage = {
      6: {
        pageRef: 1,
        page: { ...nestedTitlePlan.pages[0]!, id: 1, pageNumber: 5 },
      },
    };

    const diagram3 = nestedTitlePlan.diagrams.find((d) => d.id === 3);
    expect(diagram3!.childDiagrams![0]?.diagramRef).toBe(6);
    expect(diagram3!.childDiagrams![0]?.labels).toHaveLength(2);
    expect(diagram3!.childDiagrams![0]?.labels[0]?.id).toBe(41);
    expect(diagram3!.childDiagrams![0]?.labels[0]?.displayText).toBe("Diag. ACA");
    expect(diagram3!.childDiagrams![0]?.labels[1]?.id).toBe(42);
    expect(diagram3!.childDiagrams![0]?.labels[1]?.displayText).toBe("See T?");

    const extractedNodes = extractDiagramNodes(nestedTitlePlan.diagrams, mockLookupTbl);

    expect(extractedNodes).toHaveLength(26);
    const extractedNodeMap = Object.fromEntries(extractedNodes.map((n) => [n.id, n]));

    const labelNode41 = extractedNodeMap["41"];
    expect(labelNode41?.id).toBe("41");
    expect(labelNode41?.label).toBe("Diag. ACA");

    const labelNode42 = extractedNodeMap["42"];
    expect(labelNode42?.id).toBe("42");
    expect(labelNode42?.label).toBe("See T5");
  });

  test("extractEdges extracts edge data", () => {
    const extractedEdges = extractDiagramEdges(mockPlanData.diagrams);
    expect(extractedEdges).toHaveLength(31);
    const extractedEdgeMap = Object.fromEntries(extractedEdges.map((n) => [n.id, n]));

    expect(extractedEdgeMap["1001_0"]?.id).toBe("1001_0");
    expect(extractedEdgeMap["1001_0"]?.sourceNodeId).toBe("40001");
    expect(extractedEdgeMap["1001_0"]?.destNodeId).toBe("40002");
    expect(extractedEdgeMap["1001_0"]?.properties?.["diagramId"]).toBe(2);
    expect(extractedEdgeMap["1001_0"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1001_0"]?.properties?.["pointWidth"]).toBe(1.0);

    expect(extractedEdgeMap["1002_0"]?.id).toBe("1002_0");
    expect(extractedEdgeMap["1002_0"]?.sourceNodeId).toBe("10002");
    expect(extractedEdgeMap["1002_0"]?.destNodeId).toBe("10003");
    expect(extractedEdgeMap["1002_0"]?.properties?.["diagramId"]).toBe(1);
    expect(extractedEdgeMap["1002_0"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1002_0"]?.properties?.["pointWidth"]).toBe(1.0);

    expect(extractedEdgeMap["1003_0"]?.id).toBe("1003_0");
    expect(extractedEdgeMap["1003_0"]?.sourceNodeId).toBe("40002");
    expect(extractedEdgeMap["1003_0"]?.destNodeId).toBe("40003");
    expect(extractedEdgeMap["1003_0"]?.properties?.["diagramId"]).toBe(2);
    expect(extractedEdgeMap["1003_0"]?.properties?.["elementType"]).toBe("lines");
    expect(extractedEdgeMap["1003_0"]?.properties?.["pointWidth"]).toBe(1.0);

    //  Line 1007 is a broken line, check that it is split into two edges
    expect(extractedEdgeMap["1007_S"]?.id).toBe("1007_S");
    expect(extractedEdgeMap["1007_S"]?.sourceNodeId).toBe("10002");
    expect(extractedEdgeMap["1007_S"]?.destNodeId).toBe("1007_M1");

    expect(extractedEdgeMap["1007_E"]?.id).toBe("1007_E");
    expect(extractedEdgeMap["1007_E"]?.sourceNodeId).toBe("1007_M2");
    expect(extractedEdgeMap["1007_E"]?.destNodeId).toBe("10005");

    // check that irregular line is made up of multiple edges
    expect(extractedEdgeMap["3004_0"]?.id).toBe("3004_0");
    expect(extractedEdgeMap["3004_0"]?.sourceNodeId).toBe("30007");
    expect(extractedEdgeMap["3004_0"]?.destNodeId).toBe("30008");

    expect(extractedEdgeMap["3004_1"]?.id).toBe("3004_1");
    expect(extractedEdgeMap["3004_1"]?.sourceNodeId).toBe("30008");
    expect(extractedEdgeMap["3004_1"]?.destNodeId).toBe("30009");

    expect(extractedEdgeMap["3004_2"]?.id).toBe("3004_2");
    expect(extractedEdgeMap["3004_2"]?.sourceNodeId).toBe("30009");
    expect(extractedEdgeMap["3004_2"]?.destNodeId).toBe("30010");
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

  describe("Lines to edges", () => {
    it("converts a line with two coordinates to one edge", () => {
      const line: LineDTO = {
        lineType: "parcelBoundary",
        id: 1,
        coordRefs: [1, 2],
        pointWidth: 1.0,
        style: "solid",
      };
      const edges = lineToEdges(line, 2);

      expect(edges).toHaveLength(1);
      const edgeOne = edges[0];
      expect(edgeOne?.id).toBe("1_0");
      expect(edgeOne?.sourceNodeId).toBe("1");
      expect(edgeOne?.destNodeId).toBe("2");
    });

    it("converts a LineDTO with 5 coordRefs to 4 edges", () => {
      const line: LineDTO = {
        lineType: "parcelBoundary",
        id: 1,
        coordRefs: [1, 2, 3, 4, 5],
        pointWidth: 1.0,
        style: "dot1",
      };
      const edges = lineToEdges(line, 2);

      expect(edges).toHaveLength(4);

      const edgeOne = edges[0];
      expect(edgeOne?.id).toBe("1_0");
      expect(edgeOne?.sourceNodeId).toBe("1");
      expect(edgeOne?.destNodeId).toBe("2");

      const edgeTwo = edges[1];
      expect(edgeTwo?.id).toBe("1_1");
      expect(edgeTwo?.sourceNodeId).toBe("2");
      expect(edgeTwo?.destNodeId).toBe("3");

      const edgeThree = edges[2];
      expect(edgeThree?.id).toBe("1_2");
      expect(edgeThree?.sourceNodeId).toBe("3");
      expect(edgeThree?.destNodeId).toBe("4");

      const edgeFour = edges[3];
      expect(edgeFour?.id).toBe("1_3");
      expect(edgeFour?.sourceNodeId).toBe("4");
      expect(edgeFour?.destNodeId).toBe("5");
    });
  });
});
