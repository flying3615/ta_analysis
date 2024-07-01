import { IMarks, PointGeoJSON, PointGeoJSONTypeEnum } from "@linz/survey-plan-generation-api-client";
import { CommonBuilder, LatLong, OffsetXY } from "@/mocks/builders/CommonBuilder.ts";

export class MarksBuilder extends CommonBuilder<MarksBuilder> {
  private constructor(
    private mark: IMarks = {
      id: 1,
      properties: {},
    },
  ) {
    super();
  }

  static empty(): MarksBuilder {
    return new MarksBuilder();
  }

  withId(id: number): MarksBuilder {
    this.mark.id = id;
    return this;
  }

  withName(name: string): MarksBuilder {
    this.mark.properties.name = name;
    return this;
  }

  withRefId(refId: number): MarksBuilder {
    this.mark.properties.refId = refId;
    return this;
  }

  withSymbolCode(code: number): MarksBuilder {
    this.mark.properties.symbolCode = code;
    return this;
  }

  withDescription(description: string): MarksBuilder {
    this.mark.properties.description = description;
    return this;
  }

  withApproxMetres(offsetMetres: OffsetXY): MarksBuilder {
    this.mark.geometry = {
      type: PointGeoJSONTypeEnum.Point,
      coordinates: this.transformMetres(offsetMetres),
    } as PointGeoJSON;
    return this;
  }

  withCoordinates(coordinates: LatLong): MarksBuilder {
    this.mark.geometry = {
      type: PointGeoJSONTypeEnum.Point,
      coordinates: coordinates,
    } as PointGeoJSON;
    return this;
  }

  public build(): IMarks {
    return this.mark;
  }
}
