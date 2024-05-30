import { ICartesianCoords, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

export class PlanDataBuilder {
  planData: PlanResponseDTO = {
    diagrams: [],
    pages: [],
  };

  addDiagram(bottomRightPoint: ICartesianCoords, originPageOffset: ICartesianCoords = { x: 0, y: 0 }): PlanDataBuilder {
    this.planData.diagrams.push({
      bottomRightPoint,
      originPageOffset,
      coordinates: [],
      labels: [],
      lines: [],
      parcelLabels: [],
      coordinateLabels: [],
      lineLabels: [],
    });
    return this;
  }

  addCooordinate(id: number, position: ICartesianCoords, coordType: string = "node"): PlanDataBuilder {
    if (this.planData.diagrams.length == 0) {
      throw new Error("Diagram must be added before coordinate");
    }

    last(this.planData.diagrams)?.coordinates?.push({
      id,
      position,
      coordType,
    });
    return this;
  }

  addLine(
    id: number,
    coordRefs: number[],
    pointWidth: number = 1.0,
    lineType: string = "observation",
    style: string = "solid",
  ): PlanDataBuilder {
    if (this.planData.diagrams.length == 0) {
      throw new Error("Diagram must be added before line");
    }

    last(this.planData.diagrams)?.lines?.push({
      id,
      coordRefs,
      lineType,
      pointWidth,
      style,
    });
    return this;
  }

  build() {
    return this.planData;
  }
}
