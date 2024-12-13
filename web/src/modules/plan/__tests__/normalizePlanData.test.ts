import { DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import { cloneDeep } from "lodash-es";

import { mockPlanData } from "@/mocks/data/mockPlanData";
import { normalizePlanData } from "@/modules/plan/normalizePlanData";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { atanDegrees360, hypotenuse } from "@/util/positionUtil";

describe("normalizePlanData", () => {
  test("passes through plan data unchanged when coordinates and lines and their labels have the same position", () => {
    const normalizedPlanData = normalizePlanData(mockPlanData);
    expect(normalizedPlanData.diagrams).toStrictEqual(mockPlanData.diagrams);
    expect(normalizedPlanData.pages).toEqual(mockPlanData.pages);
  });

  test("normalizes plan data when coordinates and lines and their labels have different positions", () => {
    const normalizedPlanData = normalizePlanData(
      cloneDeep({
        ...mockPlanData,
        diagrams: [
          {
            ...(mockPlanData.diagrams[0] as DiagramDTO),

            coordinateLabels: [
              {
                ...mockPlanData.diagrams[0]!.coordinateLabels[0],
                position: { x: 21, y: -11 },
              } as LabelDTO,
            ],
            lineLabels: [
              {
                ...mockPlanData.diagrams[0]!.lineLabels[0],
                position: { x: 50, y: -30 },
              } as LabelDTO,
            ],
          },
          mockPlanData.diagrams[1] as DiagramDTO,
        ],
      }),
    );

    expect(normalizedPlanData.diagrams[0]!.coordinateLabels[0]!.position).toStrictEqual({ x: 20, y: -10 });
    const zoomScale = mockPlanData.diagrams[0]!.zoomScale;

    // The existing shift was 25 points at zero degrees
    // We add to this 1 metres at 360-45 degrees
    const metreAsScaledPoints = (1 / zoomScale) * (POINTS_PER_CM * 100);
    const expectedPointDelta = {
      dx: metreAsScaledPoints + mockPlanData.diagrams[0]!.coordinateLabels[0]!.pointOffset,
      dy: -metreAsScaledPoints,
    };
    expect(normalizedPlanData.diagrams[0]!.coordinateLabels[0]!.pointOffset).toBeCloseTo(
      hypotenuse(expectedPointDelta),
    );
    expect(normalizedPlanData.diagrams[0]!.coordinateLabels[0]!.anchorAngle).toBeCloseTo(
      atanDegrees360(expectedPointDelta),
    );

    expect(normalizedPlanData.diagrams[0]!.coordinates).toStrictEqual(mockPlanData.diagrams[0]!.coordinates);
    expect(normalizedPlanData.diagrams[0]!.lines).toStrictEqual(mockPlanData.diagrams[0]!.lines);
    expect(normalizedPlanData.diagrams[0]!.parcelLabelGroups).toStrictEqual(
      mockPlanData.diagrams[0]!.parcelLabelGroups,
    );

    expect(normalizedPlanData.diagrams[0]!.lineLabels[0]!.position).toStrictEqual({ x: 20, y: -40 });
    expect(normalizedPlanData.diagrams[0]!.lineLabels[0]!.pointOffset).toBeCloseTo(212.53);
    expect(normalizedPlanData.diagrams[0]!.lineLabels[0]!.anchorAngle).toBeCloseTo(17.2413);

    expect(normalizedPlanData.diagrams[0]!.childDiagrams).toStrictEqual(mockPlanData.diagrams[0]!.childDiagrams);
    expect(normalizedPlanData.diagrams[0]!.id).toStrictEqual(mockPlanData.diagrams[0]!.id);
    expect(normalizedPlanData.diagrams[0]!.id).toStrictEqual(mockPlanData.diagrams[0]!.id);
    expect(normalizedPlanData.diagrams[1]).toStrictEqual(mockPlanData.diagrams[1]);
  });
});
