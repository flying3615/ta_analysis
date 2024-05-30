import { PlanDataBuilder } from "@/mocks/data/PlanDataBuilder.ts";

export const buildMockLineTypes = () => {
  const builder = new PlanDataBuilder().addDiagram({
    x: 80,
    y: -90,
  });

  const lineStyles = [
    "solid",
    "peck1",
    "dot1",
    "dot2",
    "brokenSolid1", // Will render as solid
    "arrow1",
    "doubleArrow1",
  ];

  const gap = 5;
  const xStart = 20;
  const yStart = 20;
  const xEnd = 120;
  lineStyles.forEach((lineStyle, index) => {
    const idFrom = (index + 1) * 10;
    const idTo = (index + 1) * 10 + 1;
    const yPos = -(index * gap + yStart);

    builder.addCooordinate(idFrom, { x: xStart, y: yPos });
    builder.addCooordinate(idTo, { x: xEnd, y: yPos });

    builder.addLine((index + 1) * 1000, [idFrom, idTo], 1, "observation", lineStyle);
  });

  return builder.build();
};
