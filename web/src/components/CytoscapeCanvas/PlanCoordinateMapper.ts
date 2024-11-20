import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { keyBy } from "lodash-es";

import { GroundMetresPosition } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { Position } from "@/util/positionUtil";

export class PlanCoordinateMapper {
  protected readonly diagrams: Record<number, DiagramDTO>;

  constructor(diagrams: DiagramDTO[]) {
    this.diagrams = keyBy(diagrams, "id");
  }

  /**
   * Convert a ground coordinate to plan centimetres
   * at the diagram scale
   *
   * @param diagramId the id of the diagram
   * @param position the position to convert
   */
  groundCoordToCm(diagramId: number, position: GroundMetresPosition): Position {
    const diagram = this.diagrams[diagramId];

    if (!diagram) {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }
    if (!diagram.zoomScale) {
      throw new Error(`Diagram ${JSON.stringify(diagram)} has no zoomScale`);
    }
    return groudCoordToCmForDiagram(diagram, position);
  }
}

export const groudCoordToCmForDiagram = (diagram: DiagramDTO, position: GroundMetresPosition): Position => {
  const xPosCm = (position?.x * 100) / diagram.zoomScale + diagram.originPageOffset.x * 100;
  const yPosCm = (position?.y * 100) / diagram.zoomScale + diagram.originPageOffset.y * 100;
  return { x: xPosCm, y: yPosCm };
};
