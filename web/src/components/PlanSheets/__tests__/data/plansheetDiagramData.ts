import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";

export const nestedTitlePlan = new PlanDataBuilder()
  .addDiagram(
    {
      x: 58.33,
      y: -57.355,
    },
    undefined,
    "sysGenPrimaryDiag",
    1,
    1,
  )
  .addLabel(
    "labels",
    1,
    "System Generated Primary Diagram",
    {
      x: 29.165,
      y: 0,
    },
    1,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 15.049,
      y: -14.104,
    },
    undefined,
    "userDefnPrimaryDiag",
    3,
    11,
  )
  .addLabel(
    "labels",
    1,
    "Diag. AC",
    {
      x: 7.524,
      y: 0,
    },
    3,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 6 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnPrimaryDiag",
    4,
    7,
  )
  .addLabel(
    "labels",
    12,
    "Diag. AB",
    {
      x: 12.167,
      y: 0,
    },
    46,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 8 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnPrimaryDiag",
    6,
    12,
  )
  .addLabel(
    "labels",
    37,
    "Diag. ACA",
    {
      x: 12.167,
      y: 0,
    },
    46,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnPrimaryDiag",
    8,
    8,
  )
  .addLabel(
    "labels",
    37,
    "Diag. ABA",
    {
      x: 2.299,
      y: 0,
    },
    6,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 9 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnPrimaryDiag",
    9,
    9,
  )
  .addLabel(
    "labels",
    37,
    "Diag. ABAA",
    {
      x: 1.4,
      y: 0,
    },
    46,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 10 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnPrimaryDiag",
    10,
    10,
  )
  .addLabel(
    "labels",
    51,
    "Diag. ABAAA",
    {
      x: 0.872,
      y: 0,
    },
    10,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "sysGenNonPrimaryDiag",
    11,
    2,
  )
  .addLabel(
    "labels",
    54,
    "System Generated Non Primary Diagram",
    {
      x: 29.165,
      y: 0,
    },
    11,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnNonPrimaryDiag",
    12,
    4,
  )
  .addLabel(
    "labels",
    81,
    "Diag. AA",
    {
      x: 4.503,
      y: 0,
    },
    11,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 15 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnNonPrimaryDiag",
    13,
    3,
  )
  .addLabel(
    "labels",
    95,
    "Diag. A",
    {
      x: 12.167,
      y: 0,
    },
    13,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 3 })
  .addChildDiagram({ diagramRef: 4 })
  .addChildDiagram({ diagramRef: 12 })
  .addChildDiagram({ diagramRef: 14 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnNonPrimaryDiag",
    14,
    13,
  )
  .addLabel(
    "labels",
    118,
    "Diag. AD",
    {
      x: 3.467,
      y: 0,
    },
    14,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnNonPrimaryDiag",
    15,
    5,
  )
  .addLabel(
    "labels",
    114,
    "Diag. AAA",
    {
      x: 12.167,
      y: 0,
    },
    15,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 16 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnNonPrimaryDiag",
    16,
    6,
  )
  .addLabel(
    "labels",
    114,
    "Diag. AAAA",
    {
      x: 1.558,
      y: 0,
    },
    16,
    "diagram",
    "diagram",
  )
  .build();

export const nestedSurveyPlan = new PlanDataBuilder()
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "sysGenTraverseDiag",
    2,
  )
  .addLabel(
    "labels",
    177,
    "System Generated Traverse Diagram",
    {
      x: 36.579,
      y: 0,
    },
    2,
    "diagram",
    "diagram",
  )
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnTraverseDiag",
    5,
  )
  .addLabel(
    "labels",
    20,
    "Diag. A",
    {
      x: 15.319,
      y: 0,
    },
    5,
    "diagram",
    "diagram",
  )
  .addChildDiagram({ diagramRef: 7 })
  .addDiagram(
    {
      x: 0.015,
      y: -0.015,
    },
    undefined,
    "userDefnTraverseDiag",
    7,
  )
  .addLabel(
    "labels",
    40,
    "Diag. AA",
    {
      x: 4.986,
      y: 0,
    },
    5,
    "diagram",
    "diagram",
  )
  .build();
