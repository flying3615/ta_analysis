import { CoordinateDTOCoordTypeEnum, LabelDTOLabelTypeEnum, LineDTO } from "@linz/survey-plan-generation-api-client";

import { nestedTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { mockPlanData, mockPlanDataBuilder } from "@/mocks/data/mockPlanData";
import { getLineDashPattern, LineStyle, lineStyleValues } from "@/modules/plan/styling";

import {
  extractDiagramEdges,
  extractDiagramNodes,
  extractPageEdges,
  extractPageNodes,
  IDiagramToPage,
  lineToEdges,
} from "../extractGraphData";

describe("extractGraphData", () => {
  test("extractNodes extracts node data", () => {
    const extractedNodes = extractDiagramNodes(mockPlanData.diagrams);
    // 19 mark nodes + 6 labels one symbol label (we don’t extract if the label type is not user-defined)
    // + six synthetic nodes the broken line
    expect(extractedNodes).toHaveLength(48);
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
    const enhancedMockPlanData = mockPlanDataBuilder
      .addDiagram({
        bottomRightPoint: {
          x: 150,
          y: -115,
        },
        originPageOffset: {
          x: 20,
          y: -10,
        },
        zoomScale: (100 * 150) / 20,
        diagramType: "sysGenNonPrimaryDiag",
        box: true,
        pageRef: 3,
      })
      .addLabel(
        "labels",
        24,
        "Non Primary",
        {
          x: 29.165,
          y: 0,
        },
        undefined,
        undefined,
        "diagramType",
        "Tahoma",
        10.0,
        "none",
        "systemDisplay",
      )
      .addConfigs()
      .build();

    const extractedNodes = extractDiagramNodes(enhancedMockPlanData.diagrams);

    expect(extractedNodes).toHaveLength(54); // 6 labels after mark nodes in first diagram
    const extractedNodeMap = Object.fromEntries(extractedNodes.map((n) => [n.id, n]));

    const labelNode11 = extractedNodeMap["LAB_11"];
    expect(labelNode11?.id).toBe("LAB_11");
    expect(labelNode11?.label).toBe("Label 11");
    expect(labelNode11?.position).toStrictEqual({ x: 20, y: -10 });
    expect(labelNode11?.properties?.["diagramId"]).toBe(1);
    expect(labelNode11?.properties?.["elementType"]).toBe("coordinateLabels");
    expect(labelNode11?.properties?.["labelType"]).toBe("markName");
    expect(labelNode11?.properties?.["featureId"]).toBe(10001);
    expect(labelNode11?.properties?.["featureType"]).toBe("mark");
    expect(labelNode11?.properties?.["font"]).toBe("Times New Roman");
    expect(labelNode11?.properties?.["fontSize"]).toBe(10);
    expect(labelNode11?.properties?.["symbolId"]).toBeUndefined();
    expect(labelNode11?.properties?.["circled"]).toBeFalsy();
    expect(labelNode11?.properties?.["textOutlineOpacity"]).toBe(0);

    const labelNode12 = extractedNodeMap["LAB_12"];
    expect(labelNode12?.id).toBe("LAB_12");
    expect(labelNode12?.label).toBe("96");
    expect(labelNode12?.position).toStrictEqual({ x: 20, y: -10 });
    expect(labelNode12?.properties?.["diagramId"]).toBe(1);
    expect(labelNode12?.properties?.["elementType"]).toBe("coordinateLabels");
    expect(labelNode12?.properties?.["labelType"]).toBe("nodeSymbol1");
    expect(labelNode12?.properties?.["featureId"]).toBe(10001);
    expect(labelNode12?.properties?.["featureType"]).toBe("coordinate");
    expect(labelNode12?.properties?.["fontSize"]).toBe(10);
    expect(labelNode12?.properties?.["symbolId"]).toBe("96");

    const labelNode13 = extractedNodeMap["LAB_13"];
    expect(labelNode13?.id).toBe("LAB_13");
    expect(labelNode13?.label).toBe("Label 13");
    expect(labelNode13?.position).toStrictEqual({ x: 20, y: -40 });
    expect(labelNode13?.properties?.["diagramId"]).toBe(1);
    expect(labelNode13?.properties?.["elementType"]).toBe("lineLabels");
    expect(labelNode13?.properties?.["labelType"]).toBe("markName");
    expect(labelNode13?.properties?.["featureId"]).toBe(1006);
    expect(labelNode13?.properties?.["featureType"]).toBe("Line");
    expect(labelNode13?.properties?.["font"]).toBe("Arial");
    expect(labelNode13?.properties?.["fontColor"]).not.toBe("black");
    expect(labelNode13?.properties?.["fontSize"]).toBe(14);
    expect(labelNode13?.properties?.["circled"]).toBeFalsy();
    expect(labelNode13?.properties?.["textOutlineOpacity"]).toBe(0);

    const labelNode14 = extractedNodeMap["LAB_14"];
    expect(labelNode14?.id).toBe("LAB_14");
    expect(labelNode14?.label).toBe("Label 14");
    expect(labelNode14?.position).toStrictEqual({ x: 35, y: -35 });
    expect(labelNode14?.properties?.["diagramId"]).toBe(1);
    expect(labelNode14?.properties?.["elementType"]).toBe("parcelLabels");
    expect(labelNode14?.properties?.["labelType"]).toBe("parcelAppellation");
    expect(labelNode14?.properties?.["featureId"]).toBe(1);
    expect(labelNode14?.properties?.["featureType"]).toBe("parcel");
    expect(labelNode14?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode14?.properties?.["fontSize"]).toBe(16);
    expect(labelNode14?.properties?.["symbolId"]).toBeUndefined();

    const labelNode21 = extractedNodeMap["LAB_21"];
    expect(labelNode21?.id).toBe("LAB_21");
    expect(labelNode21?.label).toBe("Edited\nLine");
    expect(labelNode21?.position).toStrictEqual({ x: 85, y: -40 });
    expect(labelNode21?.properties?.["featureId"]).toBe(1001);
    expect(labelNode21?.properties?.["featureType"]).toBe("line");
    expect(labelNode21?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode21?.properties?.["fontColor"]).toBe("#000");
    expect(labelNode21?.properties?.["fontSize"]).toBe(14);
    expect(labelNode21?.properties?.["circled"]).toBeFalsy();

    const labelNode23 = extractedNodeMap["LAB_23"];
    expect(labelNode23?.id).toBe("LAB_23");
    expect(labelNode23?.label).toBe("A");
    expect(labelNode23?.position).toStrictEqual({ x: 20, y: -35 });
    expect(labelNode23?.properties?.["labelType"]).toBe(LabelDTOLabelTypeEnum.parcelAppellation);
    expect(labelNode23?.properties?.["featureId"]).toBe(1);
    expect(labelNode23?.properties?.["featureType"]).toBe("parcel");
    expect(labelNode23?.properties?.["font"]).toBe("Tahoma");
    expect(labelNode23?.properties?.["fontColor"]).toBe("#B0B0F0");
    expect(labelNode23?.properties?.["fontSize"]).toBe(14);
    expect(labelNode23?.properties?.["circled"]).toBeTruthy();
    expect(labelNode23?.properties?.["textOutlineOpacity"]).toBe(1);

    const labelNode24 = extractedNodeMap["LAB_24"];
    expect(labelNode24?.id).toBe("LAB_24");
    expect(labelNode24?.label).toBe("Non Primary");
    expect(labelNode24?.properties.labelType).toBe("diagramType");
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

    const labelNode41 = extractedNodeMap["LAB_41"];
    expect(labelNode41?.id).toBe("LAB_41");
    expect(labelNode41?.label).toBe("Diag. ACA");

    const labelNode42 = extractedNodeMap["LAB_42"];
    expect(labelNode42?.id).toBe("LAB_42");
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

    const labelNode41 = extractedNodeMap["LAB_41"];
    expect(labelNode41?.id).toBe("LAB_41");
    expect(labelNode41?.label).toBe("Diag. ACA");

    const labelNode42 = extractedNodeMap["LAB_42"];
    expect(labelNode42?.id).toBe("LAB_42");
    expect(labelNode42?.label).toBe("See T5");
  });

  test("extractEdges extracts edge data", () => {
    const extractedEdges = extractDiagramEdges(mockPlanData.diagrams);
    expect(extractedEdges).toHaveLength(35);
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

  test("Elements have unique ids", () => {
    const plandata = new PlanDataBuilder()
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        zoomScale: (100 * 90) / 20,
        pageRef: 10,
      })
      .addCooordinate(10, { x: 21, y: -10 })
      .addCooordinate(11, { x: 30, y: -10 })
      .addLabel("coordinateLabels", 10, "Some Text", { x: 21, y: -10 })
      .addSymbolLabel(11, "96", { x: 21, y: -10 }, 10)
      .addLine(10, [10, 11], 1.0, "observation", "solid")
      .addPage({ pageNumber: 1, pageType: "title", id: 10 })
      .addUserCoordinate({ coordType: CoordinateDTOCoordTypeEnum.userDefined, id: 12, position: { x: 30, y: -5 } })
      .addUserCoordinate({ coordType: CoordinateDTOCoordTypeEnum.userDefined, id: 13, position: { x: 30, y: -10 } })
      .addUserLine({ lineType: "userDefined", id: 11, coordRefs: [12, 13], pointWidth: 1.0, style: "solid" })
      .build();

    const extractedNodes = extractDiagramNodes(plandata.diagrams);
    const extractedEdges = extractDiagramEdges(plandata.diagrams);
    const extractedPageNodes = extractPageNodes(plandata.pages);
    const extractedPageEdges = extractPageEdges(plandata.pages);
    const ids = [...extractedNodes, ...extractedEdges, ...extractedPageNodes, ...extractedPageEdges].map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(ids).toHaveLength(uniqueIds.size);
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
    expect(extractedNodes).toHaveLength(3);
    const userAnnotationNode = extractedNodes[0];
    expect(userAnnotationNode?.id).toBe("LAB_23");
    expect(userAnnotationNode?.position).toStrictEqual({ x: 0.25, y: -0.05 });
    expect(userAnnotationNode?.label).toBe("Rotated user added text");
    expect(userAnnotationNode?.properties?.["elementType"]).toBe("labels");
    expect(userAnnotationNode?.properties?.["labelType"]).toBe("userAnnotation");
    expect(userAnnotationNode?.properties?.["displayState"]).toBe("display");
    expect(userAnnotationNode?.properties?.["font"]).toBe("Tahoma");
    expect(userAnnotationNode?.properties?.["fontSize"]).toBe(14);
    expect(userAnnotationNode?.properties?.["fontStyle"]).toBe("italic");
    expect(userAnnotationNode?.properties?.["textAlignment"]).toBe("centerCenter");
    expect(userAnnotationNode?.properties?.["textOutlineOpacity"]).toBe(0);
    expect(userAnnotationNode?.properties?.["anchorAngle"]).toBe(72.7);
    expect(userAnnotationNode?.properties?.["pointOffset"]).toBe(0);
    expect(userAnnotationNode?.properties?.["textRotation"]).toBe(25);
  });

  test("extractPageEdges extracts edge data", () => {
    const extractedPageEdges = extractPageEdges(mockPlanData.pages);
    expect(extractedPageEdges).toHaveLength(1);
    const extractedPageEdgesMap = Object.fromEntries(extractedPageEdges.map((n) => [n.id, n]));

    expect(extractedPageEdgesMap["10013_0"]?.id).toBe("10013_0");
    expect(extractedPageEdgesMap["10013_0"]?.sourceNodeId).toBe("10011");
    expect(extractedPageEdgesMap["10013_0"]?.destNodeId).toBe("10012");
    expect(extractedPageEdgesMap["10013_0"]?.properties?.["originalStyle"]).toBe("arrowhead");
    expect(extractedPageEdgesMap["10013_0"]?.properties?.["lineType"]).toBe("userDefined");
    expect(extractedPageEdgesMap["10013_0"]?.properties?.["coordRefs"]).toBe("[10011,10012]");
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
