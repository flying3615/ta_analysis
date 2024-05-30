import { PlanDataBuilder } from "@/mocks/data/PlanDataBuilder.ts";

export const mockPlanData = new PlanDataBuilder()
  .addDiagram({
    x: 80,
    y: -90,
  })

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
  .addCooordinate(30001, {
    x: 20,
    y: -75,
  })
  .addCooordinate(30002, {
    x: 80,
    y: -75,
  })
  .addCooordinate(20001, {
    x: 20,
    y: -80,
  })
  .addCooordinate(20002, {
    x: 80,
    y: -80,
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
  .addDiagram({
    x: 80,
    y: -90,
  })
  .build();
