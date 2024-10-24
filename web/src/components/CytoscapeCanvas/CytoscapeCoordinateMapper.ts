import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { degreesToRadians, radiansToDegrees } from "@turf/helpers";
import { BoundingBox12 } from "cytoscape";
import { keyBy } from "lodash-es";

import { pointsPerCm } from "@/util/cytoscapeUtil";

import { GroundMetresPosition } from "./cytoscapeDefinitionsFromData";

export class CytoscapeCoordinateMapper {
  public readonly scalePixelsPerCm: number;
  private readonly diagrams: Record<number, DiagramDTO>;

  // These are taken from PageConfig in the XML and are thought to be hardcoded in SQL
  // they define the page size in cm
  // I have kept to the legacy names here
  public static readonly diagramLimitOriginX = 1.5;
  public static readonly diagramLimitOriginY = -1.5;
  public static readonly diagramLimitBottomRightX = 40.5;
  public static readonly diagramLimitBottomRightY = -26.2;
  public static readonly borderBottomRightY = -28.2;
  private readonly pixelMargin: number;

  constructor(
    canvas: HTMLElement,
    diagrams: DiagramDTO[],
    maxWidth = canvas.clientWidth,
    maxHeight = canvas.clientHeight,
    pixelMargin = 40 - 50, // this is negative as our frame has its own border of 1.5cm => 50px
  ) {
    this.diagrams = keyBy(diagrams, "id");
    this.pixelMargin = pixelMargin;

    // The diagram limit is actually the page size in cm.
    // The origin should be shifted on the page so
    // that the page border lines fit on
    const pageWidth =
      CytoscapeCoordinateMapper.diagramLimitBottomRightX + CytoscapeCoordinateMapper.diagramLimitOriginX;
    const pageHeight = CytoscapeCoordinateMapper.borderBottomRightY + CytoscapeCoordinateMapper.diagramLimitOriginY;
    // Scales are in pixels per centimetre
    const scaleX = (maxWidth - this.pixelMargin) / pageWidth;
    const scaleY = Math.abs((maxHeight - this.pixelMargin) / pageHeight);

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
        `groundCoordToCytoscape has position ${JSON.stringify(position)} outside range (x: 0, y: 0)->(${JSON.stringify(diagram.bottomRightPoint)}`,
      );
    }
    const xPosCm = (position?.x * 100) / diagram.zoomScale + diagram.originPageOffset.x * 100;
    const yPosCm = (position?.y * 100) / diagram.zoomScale + diagram.originPageOffset.y * 100;
    return {
      x: this.planCmToCytoscape(xPosCm) + this.pixelMargin,
      y: this.pixelMargin - this.planCmToCytoscape(yPosCm),
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

    const xPosMeter = this.cytoscapeToPlanMeter(position.x - this.pixelMargin);
    const yPosMeter = this.cytoscapeToPlanMeter(this.pixelMargin - position.y);
    return {
      x: this.round((xPosMeter - diagram.originPageOffset.x) * diagram.zoomScale),
      y: this.round((yPosMeter - diagram.originPageOffset.y) * diagram.zoomScale),
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
      x: this.planCmToCytoscape(xPosCm) + this.pixelMargin,
      y: -this.planCmToCytoscape(yPosCm) + this.pixelMargin,
    };
  }
  /**
   * Converts page labels coordinates (metres) to Cytoscape pixel coordinates.
   * @param position - Page label coordinates to convert.
   * @returns Cytoscape pixel coordinates.
   */
  pageLabelCoordToCytoscape(position: GroundMetresPosition): cytoscape.Position {
    const xPosInMetres = position.x;
    const yPosInMetres = position.y;
    return {
      x: this.planMeterToCytoscape(xPosInMetres) + this.pixelMargin,
      y: -this.planMeterToCytoscape(yPosInMetres) + this.pixelMargin,
    };
  }

  /**
   * Converts Cytoscape pixel coordinates to page labels coordinates (metres).
   * @param position - Cytoscape pixel coordinates to convert.
   * @returns Page label coordinates.
   */
  pageLabelCytoscapeToCoord(position: cytoscape.Position): GroundMetresPosition {
    const xPosMeter = this.cytoscapeToPlanMeter(position.x - this.pixelMargin);
    const yPosMeter = this.cytoscapeToPlanMeter(-position.y + this.pixelMargin);
    return {
      x: xPosMeter,
      y: yPosMeter,
    };
  }

  /**
   * Calculate moved label element's new pointOffset and anchorAngle based on its new position.
   * @param movedElement
   * @param startPosition
   */
  diagramLabelPositionToOffsetAndAngle(movedElement: cytoscape.NodeSingular, startPosition: cytoscape.Position) {
    const anchorAngleDegs = Number(movedElement.data("anchorAngle"));
    const angleRadsAntiClockwise = degreesToRadians(anchorAngleDegs);
    const currentPointOffset = Number(movedElement.data("pointOffset"));

    const offsetCytoscape = this.pointToCytoscape(currentPointOffset);

    const oxCytoscape = Math.cos(angleRadsAntiClockwise) * offsetCytoscape;
    const oyCytoscape = Math.sin(angleRadsAntiClockwise) * offsetCytoscape;

    // note that cytoscape is y down, so we have to invert here
    const dxCytoscape = movedElement.position().x - startPosition.x;
    const dyCytoscape = -(movedElement.position().y - startPosition.y);

    const movedToXCytoscape = dxCytoscape + oxCytoscape;
    const movedToYCytoscape = dyCytoscape + oyCytoscape;

    const pointOffset = this.cytoscapeToPoint(
      Math.sqrt(movedToXCytoscape * movedToXCytoscape + movedToYCytoscape * movedToYCytoscape),
    );

    const anchorAngle = (radiansToDegrees(Math.atan2(movedToYCytoscape, movedToXCytoscape)) + 360) % 360;

    return { pointOffset, anchorAngle };
  }

  pageLabelPositionsToOffsetAndAngle(movedElement: cytoscape.NodeSingular) {
    const movedToXCytoscape = movedElement.position().x;
    const movedToYCytoscape = movedElement.position().y;

    const pointOffset = this.cytoscapeToPlanMeter(
      Math.sqrt(movedToXCytoscape * movedToXCytoscape + movedToYCytoscape * movedToYCytoscape),
    );
    const anchorAngle = (radiansToDegrees(Math.atan2(movedToYCytoscape, movedToXCytoscape)) + 360) % 360;
    return { pointOffset, anchorAngle };
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
   * Returns the diagram outer limits in pixels
   */
  getDiagramOuterLimitsPx(): BoundingBox12 {
    const pixelMargin = Math.abs(this.pixelMargin);
    return {
      x1: this.planCmToCytoscape(CytoscapeCoordinateMapper.diagramLimitOriginX) - pixelMargin,
      x2: this.planCmToCytoscape(CytoscapeCoordinateMapper.diagramLimitBottomRightX) - pixelMargin,
      y1: this.planCmToCytoscape(Math.abs(CytoscapeCoordinateMapper.diagramLimitOriginY)) - pixelMargin,
      y2: this.planCmToCytoscape(Math.abs(CytoscapeCoordinateMapper.diagramLimitBottomRightY)) - pixelMargin,
    };
  }

  /**
   * Convert cytoscape pixels into points
   * @param cy
   */
  cytoscapeToPoint(cy: number): number {
    return this.cytoscapeToPlanCm(cy) * pointsPerCm;
  }

  /**
   * Convert cytoscape pixels into meters
   * @param cy
   */
  cytoscapeToPlanMeter(cy: number): number {
    return this.cytoscapeToPlanCm(cy) / 100;
  }

  /**
   * Convert meters into cytoscape pixels
   * @param meters
   */
  planMeterToCytoscape(meters: number): number {
    return this.planCmToCytoscape(meters * 100);
  }

  /**
   * Convert points into cytoscape pixels
   * @param points
   */
  pointToCytoscape(points: number): number {
    return this.planCmToCytoscape(points / pointsPerCm);
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
