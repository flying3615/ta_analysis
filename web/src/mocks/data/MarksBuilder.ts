import { IMarks, PointGeoJSON, PointGeoJSONTypeEnum } from "@linz/survey-plan-generation-api-client";

export class MarksBuilder {
  private constructor(
    private mark: IMarks = {
      id: 1,
      properties: {},
    },
  ) {}

  static empty(): MarksBuilder {
    return new MarksBuilder();
  }

  static originMark(): MarksBuilder {
    return new MarksBuilder()
      .withName("PEG 1 DP 123")
      .withRefId(1)
      .withSymbolCode(1)
      .withCoordinates([170.970892, -45.068865]);
  }

  static nonWitnessOriginMark(): MarksBuilder {
    return new MarksBuilder()
      .withId(2)
      .withName("PEG 2 DP 123")
      .withRefId(2)
      .withSymbolCode(2)
      .withCoordinates([170.971792900901, -45.068865]);
  }

  static newPRM(): MarksBuilder {
    return new MarksBuilder()
      .withId(3)
      .withName("PEG 3 DP 123")
      .withRefId(3)
      .withSymbolCode(3)
      .withCoordinates([170.972693801802, -45.068865]);
  }

  static oldPRM(): MarksBuilder {
    return new MarksBuilder()
      .withId(4)
      .withName("PEG 4 DP 123")
      .withRefId(4)
      .withSymbolCode(4)
      .withCoordinates([170.973594702703, -45.068865]);
  }

  static newWitnessMark(): MarksBuilder {
    return new MarksBuilder()
      .withId(5)
      .withName("PEG 5 DP 123")
      .withRefId(5)
      .withSymbolCode(5)
      .withCoordinates([170.970892, -45.0684145495496]);
  }

  static oldWitnessMark(): MarksBuilder {
    return new MarksBuilder()
      .withId(6)
      .withName("PEG 6 DP 123")
      .withRefId(6)
      .withSymbolCode(6)
      .withCoordinates([170.971792900901, -45.0684145495496]);
  }
  //Boundary post New / adopted
  static postAdoptedNewMark(): MarksBuilder {
    return new MarksBuilder()
      .withId(7)
      .withName("PEG 7 DP 123")
      .withRefId(7)
      .withSymbolCode(7)
      .withCoordinates([170.972693801802, -45.0684145495496]);
  }

  //Boundary post Old
  static postOtherMark(): MarksBuilder {
    return new MarksBuilder()
      .withId(8)
      .withName("PEG 8 DP 123")
      .withRefId(8)
      .withSymbolCode(8)
      .withCoordinates([170.973594702703, -45.0684145495496]);
  }

  static unmarkedPoint(): MarksBuilder {
    return new MarksBuilder()
      .withId(9)
      .withName("PEG 9 DP 123")
      .withRefId(9)
      .withSymbolCode(9)
      .withCoordinates([170.970892, -45.0679640990991]);
  }

  static pegNew(): MarksBuilder {
    return new MarksBuilder()
      .withId(10)
      .withName("PEG 10 DP 123")
      .withRefId(10)
      .withSymbolCode(10)
      .withCoordinates([170.971792900901, -45.0679640990991]);
  }

  static pegOther(): MarksBuilder {
    return new MarksBuilder()
      .withId(11)
      .withName("PEG 11 DP 123")
      .withRefId(11)
      .withSymbolCode(11)
      .withCoordinates([170.972693801802, -45.0679640990991]);
  }

  static adoptedCadastralSurveyNetworkMarkOrVCM(): MarksBuilder {
    return new MarksBuilder()
      .withId(12)
      .withName("PEG 12 DP 123")
      .withRefId(12)
      .withSymbolCode(12)
      .withCoordinates([170.973594702703, -45.0679640990991]);
  }

  static oldCadastralSurveyNetworkMarkOrVCM(): MarksBuilder {
    return new MarksBuilder()
      .withId(13)
      .withName("PEG 13 DP 123")
      .withRefId(13)
      .withSymbolCode(13)
      .withCoordinates([170.970892, -45.0675136486486]);
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

  withCoordinates(coordinates: [number, number]): MarksBuilder {
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
