import { IDiagram } from "@linz/survey-plan-generation-api-client";

import { GroundMetresPosition } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export class CytoscapeCoordinateMapper {
  private readonly scalePixelsPerCm: number;
  private readonly offsetXPixels: number;
  private readonly offsetYPixels: number;
  private readonly diagramScalesMetresPerCm: number[];

  // These are taken from PageConfig in the XML and are thought to be hardcoded in SQL
  // they define the page size in cm
  // I have kept to the legacy names here
  public static readonly diagramLimitOriginX = 1.5;
  public static readonly diagramLimitOriginY = -1.5;
  public static readonly diagramLimitBottomRightX = 40.5;
  public static readonly diagramLimitBottomRightY = -26.2;

  constructor(
    viewport: { width: number; height: number },
    private diagrams: IDiagram[],
  ) {
    // The diagram limit is actually the page size in cm.
    const diagramWidth =
      CytoscapeCoordinateMapper.diagramLimitBottomRightX - CytoscapeCoordinateMapper.diagramLimitOriginX;
    const diagramHeight =
      CytoscapeCoordinateMapper.diagramLimitBottomRightY - CytoscapeCoordinateMapper.diagramLimitOriginY;
    // Scales are in pixels per centimetre
    const scaleX = viewport.width / diagramWidth;
    const scaleY = Math.abs(viewport.height / diagramHeight);

    // We want to scale the page to fit within the viewport whilst maintaining the
    // shape of the plan - so we have the same scale for X and Y.
    // The controlling factor is the axis with least room to fit
    // (which might be the shorter of the two where e.g the diagram is 'wide' and
    // the window is 'tall')
    // We find this axis from the scale with the smallest magnitude => less pixels per cm
    // and we apply an offset to centre the page in the other axis.
    this.offsetXPixels = 0;
    this.offsetYPixels = 0;
    if (scaleX > scaleY) {
      this.scalePixelsPerCm = scaleY;
      this.offsetXPixels = (viewport.width - diagramWidth * this.scalePixelsPerCm) / 2;
    } else {
      this.scalePixelsPerCm = scaleX;
      this.offsetYPixels = (viewport.height - Math.abs(diagramHeight) * this.scalePixelsPerCm) / 2;
    }

    // We now want to scale each diagrams points into page coordinates
    // To do this we find the limits of out diagram and compute the scale
    // (again based on the longest side) in diagram coordinates (map cm) per page coordinate
    this.diagramScalesMetresPerCm = this.diagrams.map((diagram) => {
      const diagramScaleX = (diagram.bottomRightPoint.x - diagram.originPageOffset.x) / diagramWidth;
      const diagramScaleY = (diagram.bottomRightPoint.y - diagram.originPageOffset.y) / diagramHeight;
      return Math.max(diagramScaleX, diagramScaleY);
    });
  }

  /**
   * Convert a position in ground coordinates (metres) into cytoscape pixels
   *
   * @param position the position to convert
   * @param diagramIndex the index of the diagram, used to offset
   */
  groundCoordToCytoscape(position: GroundMetresPosition, diagramIndex: number): cytoscape.Position {
    const diagram = this.diagrams[diagramIndex] as IDiagram;
    const diagramScale = this.diagramScalesMetresPerCm[diagramIndex] as number;

    const xPosCm = (position?.x - diagram.originPageOffset.x) / diagramScale;
    const yPosCm = (position?.y - diagram.originPageOffset.y) / diagramScale;
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
}
