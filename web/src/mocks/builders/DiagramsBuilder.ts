import { DiagramsResponseDTO, PolygonGeoJSON, PolygonGeoJSONTypeEnum } from "@linz/survey-plan-generation-api-client";
import { DiagramsResponseDTODiagramsInner } from "@linz/survey-plan-generation-api-client/src/models/DiagramsResponseDTODiagramsInner";
import { last } from "lodash-es";

import { CommonBuilder, LatLong, TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder";

export const diagramsBuilderTestOrigin = () => DiagramsBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

export class DiagramsBuilder extends CommonBuilder<DiagramsBuilder> {
  private diagramsData = { diagrams: [] as DiagramsResponseDTODiagramsInner[] };

  static empty(): DiagramsBuilder {
    return new DiagramsBuilder();
  }

  withDiagram(): DiagramsBuilder {
    this.diagramsData.diagrams.push({} as DiagramsResponseDTODiagramsInner);
    return this;
  }

  withId(id: number): DiagramsBuilder {
    if (this.diagramsData.diagrams.length === 0) {
      throw new Error("withDiagram must be called before withId");
    }
    last(this.diagramsData.diagrams)!.id = id;
    return this;
  }

  withDiagramType(name: string): DiagramsBuilder {
    if (this.diagramsData.diagrams.length === 0) {
      throw new Error("withDiagram must be called before withDiagramType");
    }
    last(this.diagramsData.diagrams)!.diagramType = name;
    return this;
  }

  withApproxMetres(offsetMetres: LatLong[][]): DiagramsBuilder {
    if (this.diagramsData.diagrams.length === 0) {
      throw new Error("withDiagram must be called before withApproxMetres");
    }
    last(this.diagramsData.diagrams)!.shape = {
      type: PolygonGeoJSONTypeEnum.Polygon,
      coordinates: offsetMetres.map((ring) => ring.map((segment) => this.transformMetres(segment))),
    } as PolygonGeoJSON;
    return this;
  }

  public build(): DiagramsResponseDTO {
    return this.diagramsData;
  }
}
