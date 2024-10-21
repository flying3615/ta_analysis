import {
  CartesianCoordsDTO,
  DiagramsResponseDTO,
  PostDiagramsRequestDTODiagramTypeEnum,
} from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { coordDimensions, flattenCoords } from "@/util/coordUtil";
import { sizeDegreesToMetresAtLat } from "@/util/mapUtil";

export default class ScaleDiagram {
  private readonly planfaceSizeMetres: [number, number] = [
    (CytoscapeCoordinateMapper.diagramLimitBottomRightX - CytoscapeCoordinateMapper.diagramLimitOriginX) / 100,
    (CytoscapeCoordinateMapper.diagramLimitOriginY - CytoscapeCoordinateMapper.borderBottomRightY) / 100,
  ];

  private readonly sysGenDiagramsSizeMetres: [number, number];

  private readonly systemGeneratedDiagramTypes = [
    PostDiagramsRequestDTODiagramTypeEnum.SYSP,
    PostDiagramsRequestDTODiagramTypeEnum.SYST,
    PostDiagramsRequestDTODiagramTypeEnum.SYSN,
  ] as string[];

  constructor(diagrams: DiagramsResponseDTO) {
    const sysGenDiagramCoords = diagrams?.diagrams
      ?.filter((diagram) => this.systemGeneratedDiagramTypes.includes(diagram.diagramType))
      ?.flatMap((diagram) => flattenCoords(diagram.shape.coordinates));
    this.sysGenDiagramsSizeMetres = sizeDegreesToMetresAtLat(
      coordDimensions(sysGenDiagramCoords),
      sysGenDiagramCoords?.[0]?.[1] ?? -45.0,
    );
  }

  zoomScale(latLongCartesians: CartesianCoordsDTO[]) {
    const diagramSizeDegrees = coordDimensions(latLongCartesians.map((ll) => [ll.x, ll.y]));
    const diagramSizeMetres = sizeDegreesToMetresAtLat(diagramSizeDegrees, latLongCartesians?.[0]?.y ?? -45.0);

    if (!latLongCartesians || latLongCartesians.length === 0) {
      return this.scaleByLongestDimension(diagramSizeMetres);
    }

    if (diagramSizeMetres[0] < this.sysGenDiagramsSizeMetres[0]) {
      if (diagramSizeMetres[1] < this.sysGenDiagramsSizeMetres[1]) {
        return this.sysGenDiagramsSizeMetres[0] / this.planfaceSizeMetres[0];
      }
      return diagramSizeMetres[1] / this.planfaceSizeMetres[1];
    }

    return this.scaleByLongestDimension(diagramSizeMetres);
  }

  private scaleByLongestDimension(diagramSizeMetres: [number, number]) {
    const zoomScale = diagramSizeMetres[0] / this.planfaceSizeMetres[0];
    if (diagramSizeMetres[1] / zoomScale > this.planfaceSizeMetres[1]) {
      return diagramSizeMetres[1] / this.planfaceSizeMetres[1];
    }

    return zoomScale;
  }
}
