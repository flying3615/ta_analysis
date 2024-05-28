import { IObservation, LineStringGeoJSON, LineStringGeoJSONTypeEnum } from "@linz/survey-plan-generation-api-client";
import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";

export class VectorsBuilder {
  private constructor(
    private vector: IObservation = {
      id: 1,
      transactionId: 1,
      properties: {},
    },
  ) {}

  static empty(): VectorsBuilder {
    return new VectorsBuilder();
  }
  // Vector from Boundary post old to oldCadastralSurveyNetworkMarkOrVCM
  static parcelDimensionVectorPrimary(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass()
      .withPrimary("Y")
      .withNonPrimary("N")
      .withTraverse("N")
      .withCoordinates([
        [170.973594702703, -45.0684145495496],
        [170.970892, -45.0675136486486],
      ]);
  }
  // vector from oldCadastralSurveyNetworkMarkOrVCM to Boundary post new
  static parcelDimensionVectorNonPrimary(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass()
      .withPrimary("N")
      .withNonPrimary("Y")
      .withTraverse("N")
      .withCoordinates([
        [170.970892, -45.0675136486486],
        [170.972693801802, -45.0684145495496],
      ]);
  }

  // Vector from Boundary post old to adoptedCadastralSurveyNetworkMarkOrVCM
  static nonBoundaryPseudo(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.PSED)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.973594702703, -45.0684145495496],
        [170.973594702703, -45.0679640990991],
      ]);
  }
  // Vector from old primary to new primary
  static nonBoundaryCalculated(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.CALC)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.973594702703, -45.068865],
        [170.972693801802, -45.068865],
      ]);
  }

  // Vector from Boundary post old to Boundary post new
  static nonBoundaryAdopted(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.ADPT)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.973594702703, -45.0684145495496],
        [170.972693801802, -45.0684145495496],
      ]);
  }
  // Vector from Boundary post old to New primary
  static nonBoundaryMeasured(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.MEAS)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.973594702703, -45.0684145495496],
        [170.972693801802, -45.068865],
      ]);
  }
  // Vector from New Primary to adoptedCadastralSurveyNetworkMarkOrVCM
  static nonBoundaryReinstatedAdopted(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.REIA)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.972693801802, -45.068865],
        [170.973594702703, -45.0679640990991],
      ]);
  }

  // Vector from Boundary post new to old primary
  static nonBoundaryReinstatedCalculated(id: number, transactionId: number): VectorsBuilder {
    return new VectorsBuilder()
      .withId(id)
      .withTransactionId(transactionId)
      .withSurveyClass(ObservationElementSurveyedClassCode.REIC)
      .withPrimary("N")
      .withNonPrimary("N")
      .withTraverse("Y")
      .withCoordinates([
        [170.972693801802, -45.0684145495496],
        [170.973594702703, -45.068865],
      ]);
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

  withCoordinates(coordinates: [number, number][]): VectorsBuilder {
    this.vector.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates,
    } as LineStringGeoJSON;
    return this;
  }

  public build(): IObservation {
    return this.vector;
  }
}
