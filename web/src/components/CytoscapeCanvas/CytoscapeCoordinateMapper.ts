import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { keyBy } from "lodash-es";

import { GroundMetresPosition } from "./cytoscapeDefinitionsFromData";

export class CytoscapeCoordinateMapper {
  private readonly scalePixelsPerCm: number;
  private readonly diagrams: Record<number, IDiagram>;

  // These are taken from PageConfig in the XML and are thought to be hardcoded in SQL
  // they define the page size in cm
  // I have kept to the legacy names here
  public static readonly diagramLimitOriginX = 1.5;
  public static readonly diagramLimitOriginY = -1.5;
  public static readonly diagramLimitBottomRightX = 40.5;
  public static readonly borderBottomRightY = -28.2;
  public static readonly pixelMargin = 40 - 50; // this is negative as our frame has its own border of 1.5cm => 50px

  constructor(canvas: HTMLElement, diagrams: IDiagram[]) {
    this.diagrams = keyBy(diagrams, "id");

    // The diagram limit is actually the page size in cm.
    // The origin should be shifted on the page so
    // that the page border lines fit on
    const diagramWidth =
      CytoscapeCoordinateMapper.diagramLimitBottomRightX + CytoscapeCoordinateMapper.diagramLimitOriginX;
    const diagramHeight = CytoscapeCoordinateMapper.borderBottomRightY + CytoscapeCoordinateMapper.diagramLimitOriginY;
    // Scales are in pixels per centimetre
    const scaleX = (canvas.clientWidth - CytoscapeCoordinateMapper.pixelMargin) / diagramWidth;
    const scaleY = Math.abs((canvas.clientHeight - CytoscapeCoordinateMapper.pixelMargin) / diagramHeight);

    // We want to scale the page to fit within the viewport whilst maintaining the
    // shape of the plan - so we have the same scale for X and Y.
    // The controlling factor is the axis with least room to fit
    // (which might be the shorter of the two where e.g the diagram is 'wide' and
    // the window is 'tall')
    // We find this axis from the scale with the smallest magnitude => less pixels per cm
    // This lets us place the plan in a tall or wide window with a margin
    this.scalePixelsPerCm = Math.min(scaleX, scaleY);
  }

  /**
   * Convert a position in ground coordinates (metres) into cytoscape pixels
   *
   * @param position the position to convert
   * @param diagramId the id of the diagram, used to offset
   */
  groundCoordToCytoscape(position: GroundMetresPosition, diagramId: number): cytoscape.Position {
    const diagram = this.diagrams[diagramId];

    if (!diagram || !diagram.zoomScale) {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }

    if (
      position.x < 0 ||
      position.x > diagram.bottomRightPoint.x ||
      position.y > 0 ||
      position.y < diagram.bottomRightPoint.y
    ) {
      console.warn(
        `groundCoordToCytoscape has position ${JSON.stringify(position)} outside range (0,0)->(${JSON.stringify(diagram.bottomRightPoint)}`,
      );
    }

    const xPosCm =
      (position?.x * 100) / diagram.zoomScale +
      diagram.originPageOffset.x +
      CytoscapeCoordinateMapper.diagramLimitOriginX;
    const yPosCm =
      (position?.y * 100) / diagram.zoomScale +
      diagram.originPageOffset.y +
      CytoscapeCoordinateMapper.diagramLimitOriginY;
    return {
      x: this.planCmToCytoscape(xPosCm) + CytoscapeCoordinateMapper.pixelMargin,
      y: -this.planCmToCytoscape(yPosCm) + CytoscapeCoordinateMapper.pixelMargin,
    };
  }

  /**
   * Convert a position in cytoscape pixels into ground coordinates (metres)
   *
   * @param position the position to convert
   * @param diagramId the id of the diagram, used to offset
   */
  cytoscapeToGroundCoord(position: cytoscape.Position, diagramId: number): GroundMetresPosition {
    const diagram = this.diagrams[diagramId];
    if (!diagram || !diagram.zoomScale) {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }

    const xPosCm = this.cytoscapeToPlanCm(position.x - CytoscapeCoordinateMapper.pixelMargin);
    const yPosCm = this.cytoscapeToPlanCm(-position.y + CytoscapeCoordinateMapper.pixelMargin);
    return {
      x: this.round(((xPosCm - diagram.originPageOffset.x) * diagram.zoomScale) / 100),
      y: this.round(((yPosCm - diagram.originPageOffset.y) * diagram.zoomScale) / 100),
    };
  }

  /**
   * Converts plan coordinates (centimeters) to Cytoscape pixel coordinates.
   * @param position - Plan coordinates to convert.
   * @returns Cytoscape pixel coordinates.
   */
  planCoordToCytoscape(position: GroundMetresPosition): cytoscape.Position {
    const xPosCm = position.x;
    const yPosCm = position.y;
    return {
      x: this.planCmToCytoscape(xPosCm) + CytoscapeCoordinateMapper.pixelMargin,
      y: -this.planCmToCytoscape(yPosCm) + CytoscapeCoordinateMapper.pixelMargin,
    };
  }

  /**
   * Convert relative centimetres on plan into cytoscape pixels
   *
   * @param cm a distance in cm
   */
  planCmToCytoscape(cm: number): number {
    return cm * this.scalePixelsPerCm;
  }

  /**
   * Returns a factor to scale fonts by so they agree with coordinate dimensions
   * This has been determined empirically
   */
  fontScaleFactor() {
    return this.scalePixelsPerCm / 38.3;
  }

  /**
   * Convert cytoscape pixels into relative centimetres on plan
   *
   * @param pixels a distance in pixels
   */
  private cytoscapeToPlanCm(pixels: number): number {
    return pixels / this.scalePixelsPerCm;
  }

  private round(number: number, precision = 3): number {
    return parseFloat(number.toFixed(precision));
  }
}
