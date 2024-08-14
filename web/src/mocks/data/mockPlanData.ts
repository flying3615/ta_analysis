import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";

export const mockPlanData = new PlanDataBuilder()
  .addDiagram({
    bottomRightPoint: {
      x: 80,
      y: -90,
    },
    zoomScale: (100 * 90) / 20,
    box: true,
    pageRef: 1,
  })
  .addPage(1)
  .addPage(2)
  .addCooordinate(10001, {
    x: 20,
    y: -10,
  })
  .addCooordinate(10002, {
    x: 50,
    y: -10,
  })
  .addCooordinate(10003, {
    x: 80,
    y: -10,
  })
  .addCooordinate(10004, {
    x: 80,
    y: -70,
  })
  .addCooordinate(10005, {
    x: 50,
    y: -70,
  })
  .addCooordinate(10006, {
    x: 20,
    y: -70,
  })
  .addCooordinate(20001, {
    x: 20,
    y: -80,
  })
  .addCooordinate(20002, {
    x: 80,
    y: -80,
  })
  .addCooordinate(30001, {
    x: 20,
    y: -75,
  })
  .addCooordinate(30002, {
    x: 80,
    y: -75,
  })
  .addLine(1001, [10001, 10002], 0.75, "observation", "peck1")
  .addLine(1002, [10002, 10003], 1.0, "observation", "solid")
  .addLine(1003, [10003, 10004], 4.0, "observation", "solid")
  .addLine(1004, [10004, 10005], 8.0, "observation", "solid")
  .addLine(1005, [10005, 10006], 2.0, "observation", "dot2")
  .addLine(1006, [10006, 10001], 2.0, "observation", "dot2")
  .addLine(1007, [10002, 10005], 2.0, "observation", "brokenSolid1")
  .addLine(2001, [20001, 20002], 0.75, "observation", "arrow1")
  .addLine(3001, [30001, 30002], 0.75, "observation", "doubleArrow1")
  .addLabel("coordinateLabels", 11, "Label 11", { x: 55, y: -10 }, 10001, "mark", "display", "Times New Roman", 10)
  .addSymbolLabel(12, "96", { x: 20, y: -10 }, 10)
  .addLabel("lineLabels", 13, "Label 13", { x: 52, y: -40 }, 1001, "line", "display", "Arial", 14)
  .addLabel("parcelLabels", 14, "Label 14", { x: 35, y: -35 }, 1, "parcel", "display", "Tahoma", 16)
  .addLabel(
    "labels",
    1,
    "System Generated Primary Diagram",
    { x: 50, y: -5 },
    undefined,
    undefined,
    "diagram",
    "Tahoma",
    14.0,
  )

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
    diagramType: "sysGenTraverseDiag",
    box: true,
    pageRef: 2,
  })
  .addCooordinate(40001, {
    x: 20,
    y: -10,
  })
  .addCooordinate(40002, {
    x: 80,
    y: -10,
  })
  .addCooordinate(40003, {
    x: 80,
    y: -70,
  })
  .addCooordinate(40004, {
    x: 20,
    y: -70,
  })
  .addCooordinate(40005, {
    x: 110,
    y: -100,
  })
  .addLine(1001, [40001, 40002], 1.0, "observation", "solid")
  .addLine(1003, [40002, 40003], 1.0, "observation", "solid")
  .addLine(1004, [40003, 40004], 1.0, "observation", "solid")
  .addLine(1006, [40004, 40001], 1.0, "observation", "solid")
  .addLine(1007, [40002, 40005], 1.0, "observation", "peck1")
  .addLine(1008, [40005, 40003], 1.0, "observation", "peck1")
  .addLabel("lineLabels", 21, "Line", { x: 85, y: -40 }, 1001, "line", "display", "Tahoma", 14)
  .addLabel("parcelLabels", 22, "Parcel", { x: 50, y: -35 }, 1, "parcel", "display", "Tahoma", 14, "halo")
  .addLabel(
    "parcelLabels",
    23,
    "A",
    { x: 20, y: -35 },
    1,
    "parcel",
    "display",
    "Tahoma",
    14,
    "halo",
    "systemHide",
    "circle",
  )
  .addLabel(
    "labels",
    2,
    "System Generated Traverse Diagram",
    { x: 50, y: -5 },
    undefined,
    undefined,
    "diagram",
    "Tahoma",
    14.0,
  )
  .build();
