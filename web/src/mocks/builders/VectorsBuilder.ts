import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";
import { IObservation, LineStringGeoJSON, LineStringGeoJSONTypeEnum } from "@linz/survey-plan-generation-api-client";

import { CommonBuilder, LatLong, OffsetXY } from "@/mocks/builders/CommonBuilder.ts";

export class VectorsBuilder extends CommonBuilder<VectorsBuilder> {
  private constructor(
    private vector: IObservation = {
      id: 1,
      transactionId: 1,
      properties: {},
    },
  ) {
    super();
  }

  static empty(): VectorsBuilder {
    return new VectorsBuilder();
  }

  withId(id: number): VectorsBuilder {
    this.vector.id = id;
    return this;
  }

  withTransactionId(transactionId: number): VectorsBuilder {
    this.vector.transactionId = transactionId;
    return this;
  }

  withSurveyClass(
    surveyClass: ObservationElementSurveyedClassCode = ObservationElementSurveyedClassCode.PSED,
  ): VectorsBuilder {
    this.vector.properties.surveyClass = surveyClass;
    return this;
  }

  withTraverse(traverse: string): VectorsBuilder {
    this.vector.properties.traverse = traverse;
    return this;
  }

  withPrimary(primary: string): VectorsBuilder {
    this.vector.properties.primary = primary;
    return this;
  }

  withNonPrimary(nonPrimary: string): VectorsBuilder {
    this.vector.properties.nonPrimary = nonPrimary;
    return this;
  }

  withCoordinates(coordinates: LatLong[]): VectorsBuilder {
    this.vector.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates,
    } as LineStringGeoJSON;
    return this;
  }

  withApproxMetres(offsetMetres: OffsetXY[]): VectorsBuilder {
    this.vector.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates: offsetMetres.map((segment) => this.transformMetres(segment)),
    } as LineStringGeoJSON;
    return this;
  }

  public build(): IObservation {
    return this.vector;
  }
}
