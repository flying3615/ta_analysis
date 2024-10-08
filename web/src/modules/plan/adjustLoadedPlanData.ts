import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

export const adjustLoadedPlanData = (response: PlanResponseDTO): PlanResponseDTO => {
  return {
    ...response,
    diagrams: response.diagrams.map((diagram) =>
      diagram.originPageOffset.x === 0 && diagram.originPageOffset.y === 0
        ? {
            ...diagram,
            originPageOffset: {
              x: CytoscapeCoordinateMapper.diagramLimitOriginX / 100,
              y: CytoscapeCoordinateMapper.diagramLimitOriginY / 100,
            },
          }
        : diagram,
    ),
  };
};
