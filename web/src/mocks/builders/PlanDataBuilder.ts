import { ICartesianCoords, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

export class PlanDataBuilder {
  planData: PlanResponseDTO = {
    diagrams: [],
    pages: [],
    configs: [],
  };

  addDiagram(
    bottomRightPoint: ICartesianCoords,
    originPageOffset: ICartesianCoords = {
      x: 0,
      y: 0,
    },
    diagramType: "sysGenPrimaryDiag" | "sysGenNonPrimaryDiag" | "sysGenTraverseDiag" = "sysGenPrimaryDiag",
  ): PlanDataBuilder {
    this.planData.diagrams.push({
      id: 1,
      bottomRightPoint,
      originPageOffset,
      coordinates: [],
      labels: [],
      lines: [],
      parcelLabels: [],
      coordinateLabels: [],
      lineLabels: [],
      diagramType,
    });
    return this;
  }

  addCooordinate(id: number, position: ICartesianCoords, coordType: string = "node"): PlanDataBuilder {
    if (this.planData.diagrams.length == 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addCoordinate()",
      );
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
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addLine()",
      );
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

  addSymbolLabel(id: number, displayText: string, position: ICartesianCoords, fontSize: number = 8) {
    return this.addLabel(
      "coordinateLabels",
      id,
      displayText,
      position,
      undefined,
      undefined,
      "display",
      "LOLsymbols",
      fontSize,
    );
  }

  addLabel(
    intoWhere: "labels" | "parcelLabels" | "coordinateLabels" | "lineLabels",
    id: number,
    displayText: string,
    position: ICartesianCoords,
    featureId?: number,
    featureType?: string,
    labelType: string = "markName",
    font: string = "Tahoma",
    fontSize: number = 10,
  ) {
    if (this.planData.diagrams.length == 0) {
      throw new Error(
        "Must add at least one Diagram via PlanDataBuilder.addDiagram() before calling PlanDataBuilder.addLabel()",
      );
    }

    const into = last(this.planData.diagrams)?.[intoWhere];
    if (!into) {
      throw new Error(`${intoWhere} is not a label array`);
    }

    into.push({
      id,
      displayText,
      position,
      labelType,
      font,
      fontSize,
      featureId,
      featureType,
    });
    return this;
  }

  build() {
    console.log(`Build returns ${JSON.stringify(this.planData)}`);
    return this.planData;
  }
}
