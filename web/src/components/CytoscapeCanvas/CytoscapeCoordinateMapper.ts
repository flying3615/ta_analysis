import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { keyBy } from "lodash-es";

import { GroundMetresPosition } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export class CytoscapeCoordinateMapper {
  private readonly scalePixelsPerCm: number;
  private readonly offsetXPixels: number;
  private readonly offsetYPixels: number;
  private readonly diagrams: Record<number, IDiagram>;
  private readonly diagramScalesMetresPerCm: Record<number, number>;
  private pageBorderScale: number = 1;

  // These are taken from PageConfig in the XML and are thought to be hardcoded in SQL
  // they define the page size in cm
  // I have kept to the legacy names here
  public static readonly diagramLimitOriginX = 1.5;
  public static readonly diagramLimitOriginY = -1.5;
  public static readonly diagramLimitBottomRightX = 40.5;
  public static readonly diagramLimitBottomRightY = -26.2;

  constructor(canvas: HTMLElement, diagrams: IDiagram[]) {
    this.diagrams = keyBy(diagrams, "id");

    // The diagram limit is actually the page size in cm.
    const diagramWidth =
      CytoscapeCoordinateMapper.diagramLimitBottomRightX - CytoscapeCoordinateMapper.diagramLimitOriginX;
    const diagramHeight =
      CytoscapeCoordinateMapper.diagramLimitBottomRightY - CytoscapeCoordinateMapper.diagramLimitOriginY;
    // Scales are in pixels per centimetre
    const scaleX = canvas.clientWidth / diagramWidth;
    const scaleY = Math.abs(canvas.clientHeight / diagramHeight);

    // We want to scale the page to fit within the viewport whilst maintaining the
    // shape of the plan - so we have the same scale for X and Y.
    // The controlling factor is the axis with least room to fit
    // (which might be the shorter of the two where e.g the diagram is 'wide' and
    // the window is 'tall')
    // We find this axis from the scale with the smallest magnitude => less pixels per cm
    // and we apply an offset to centre the page in the other axis.
    this.offsetXPixels = 0;
    this.offsetYPixels = 0;
    this.scalePixelsPerCm = Math.min(scaleX, scaleY);
    this.offsetXPixels = (canvas.clientWidth - diagramWidth * this.scalePixelsPerCm) / 2;
    this.offsetYPixels = (canvas.clientHeight - Math.abs(diagramHeight) * this.scalePixelsPerCm) / 2;

    // We now want to scale each diagrams points into page coordinates
    // To do this we find the limits of out diagram and compute the scale
    // (again based on the longest side) in diagram coordinates (map cm) per page coordinate
    this.diagramScalesMetresPerCm = {};
    diagrams.forEach((diagram) => {
      const diagramScaleX = (diagram.bottomRightPoint.x - diagram.originPageOffset.x) / diagramWidth;
      const diagramScaleY = (diagram.bottomRightPoint.y - diagram.originPageOffset.y) / diagramHeight;
      const diagramScale = Math.max(diagramScaleX, diagramScaleY);
      this.diagramScalesMetresPerCm[diagram.id] = diagramScale;
      this.pageBorderScale = diagramScale;
    });
  }

  /**
   * Convert a position in ground coordinates (metres) into cytoscape pixels
   *
   * @param position the position to convert
   * @param diagramId the id of the diagram, used to offset
   */
  groundCoordToCytoscape(position: GroundMetresPosition, diagramId: number): cytoscape.Position {
    const diagram = this.diagrams[diagramId];
    const diagramScale = this.diagramScalesMetresPerCm[diagramId];
    if (!diagram || !diagramScale) {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }

    const xPosCm = (position?.x - diagram.originPageOffset.x) / diagramScale;
    const yPosCm = (position?.y - diagram.originPageOffset.y) / diagramScale;
    return {
      x: this.planCmToCytoscape(xPosCm) + this.offsetXPixels,
      y: -this.planCmToCytoscape(yPosCm) + this.offsetYPixels,
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
    const diagramScale = this.diagramScalesMetresPerCm[diagramId];
    if (!diagram || !diagramScale) {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }

    const xPosCm = this.cytoscapeToPlanCm(position.x - this.offsetXPixels);
    const yPosCm = this.cytoscapeToPlanCm(-position.y + this.offsetYPixels);
    return {
      x: this.round(xPosCm * diagramScale + diagram.originPageOffset.x),
      y: this.round(yPosCm * diagramScale + diagram.originPageOffset.y),
    };
  }

  /**
   * Converts plan coordinates (centimeters) to Cytoscape pixel coordinates.
   * @param position - Plan coordinates to convert.
   * @returns Cytoscape pixel coordinates.
   */
  planCoordToCytoscape(position: GroundMetresPosition): cytoscape.Position {
    const xPosCm = ((position.x - 1) / this.pageBorderScale) * 2;
    const yPosCm = ((position.y - 1) / this.pageBorderScale) * 2;
    return {
      x: this.planCmToCytoscape(xPosCm) + this.offsetXPixels,
      y: -this.planCmToCytoscape(yPosCm) + this.offsetYPixels,
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
