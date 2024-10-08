import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";

import { adjustLoadedPlanData } from "@/modules/plan/adjustLoadedPlanData.ts";

describe("adjustLoadedPlanData", () => {
  it("leaves diagrams with an offset unchanged", () => {
    // Arrange
    const loadedData = {
      diagrams: [
        {
          originPageOffset: {
            x: 0.015,
            y: -0.015,
          },
        },
      ],
    } as PlanResponseDTO;

    const adjustedData = adjustLoadedPlanData(loadedData);

    expect(adjustedData).toEqual(loadedData);
  });

  it("applies an offset where there was none", () => {
    // Arrange
    const loadedData = {
      diagrams: [
        {
          originPageOffset: {
            x: 0,
            y: 0,
          },
        },
      ],
    } as PlanResponseDTO;

    const adjustedData = adjustLoadedPlanData(loadedData);

    expect(adjustedData).toEqual({
      diagrams: [
        {
          originPageOffset: {
            x: 0.015,
            y: -0.015,
          },
        },
      ],
    });
  });
});
