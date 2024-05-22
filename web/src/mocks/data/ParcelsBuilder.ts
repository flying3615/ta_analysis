import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import {
  IInflightParcels,
  LineStringGeoJSON,
  LineStringGeoJSONTypeEnum,
  PolygonGeoJSON,
  PolygonGeoJSONTypeEnum,
} from "@linz/survey-plan-generation-api-client";

export class ParcelsBuilder {
  private constructor(
    private parcel: IInflightParcels = {
      id: 1,
      properties: {
        actionCode: {
          code: "",
          description: "",
        },
        intentCode: {
          code: "",
          description: "",
        },
      },
    },
  ) {}

  static empty(): ParcelsBuilder {
    return new ParcelsBuilder();
  }

  static primaryParcel(): ParcelsBuilder {
    return new ParcelsBuilder()
      .withId(1)
      .withActionCode("CREA", "Created")
      .withIntentCode(ParcelIntentCode.FSIM)
      .withTopologyClass("PRIM")
      .withPolygonCoordinates([
        [
          [170.970892, -45.068865],
          [170.971792900901, -45.068865],
          [170.971792900901, -45.0684145495496],
          [170.970892, -45.0684145495496],
          [170.970892, -45.068865],
        ],
      ]);
  }

  static nonPrimaryParcel(): ParcelsBuilder {
    return new ParcelsBuilder()
      .withId(2)
      .withActionCode("CREA", "Created")
      .withIntentCode(ParcelIntentCode.FSIM)
      .withTopologyClass("SECO")
      .withPolygonCoordinates([
        [
          [170.971792900901, -45.0684145495496],
          [170.972693801802, -45.0684145495496],
          [170.972693801802, -45.068865],
          [170.971792900901, -45.068865],
          [170.971792900901, -45.0684145495496],
        ],
      ]);
  }

  static centreLineParcel(): ParcelsBuilder {
    return new ParcelsBuilder()
      .withId(3)
      .withActionCode("CREA", "Created")
      .withIntentCode(ParcelIntentCode.FSIM)
      .withTopologyClass("SECL")
      .withLineStringCoordinates([
        [170.973594702703, -45.0684145495496],
        [170.973594702703, -45.068865],
      ]);
  }

  static hydroParcel(): ParcelsBuilder {
    return new ParcelsBuilder()
      .withId(4)
      .withActionCode("CREA", "Created")
      .withIntentCode(ParcelIntentCode.HYDR)
      .withTopologyClass("PRIM")
      .withPolygonCoordinates([
        [
          [170.970892, -45.0679640990991],
          [170.971792900901, -45.0679640990991],
          [170.971792900901, -45.0684145495496],
          [170.970892, -45.0684145495496],
          [170.970892, -45.0679640990991],
        ],
      ]);
  }

  static roadParcel(): ParcelsBuilder {
    return new ParcelsBuilder()
      .withId(5)
      .withActionCode("CREA", "Created")
      .withIntentCode(ParcelIntentCode.ROAD)
      .withTopologyClass("PRIM")
      .withPolygonCoordinates([
        [
          [170.971792900901, -45.0679640990991],
          [170.972693801802, -45.0679640990991],
          [170.972693801802, -45.0684145495496],
          [170.971792900901, -45.0684145495496],
          [170.971792900901, -45.0679640990991],
        ],
      ]);
  }

  withId(id: number): ParcelsBuilder {
    this.parcel.id = id;
    return this;
  }

  withActionCode(code: string, description: string): ParcelsBuilder {
    // TODO: Add actionCode into luck-syscodes in SJ-1342
    this.parcel.properties.actionCode = { code, description };
    return this;
  }

  withIntentCode(code: ParcelIntentCode): ParcelsBuilder {
    const intentCode = ParcelIntentCode.lookup(code);
    this.parcel.properties.intentCode = {
      code: intentCode.code,
      description: intentCode.description,
    };
    return this;
  }

  withTopologyClass(topologyClass: string): ParcelsBuilder {
    this.parcel.properties.topologyClass = topologyClass;
    return this;
  }

  withLineStringCoordinates(coordinates: [number, number][]): ParcelsBuilder {
    this.parcel.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates,
    } as LineStringGeoJSON;
    return this;
  }

  withPolygonCoordinates(coordinates: [number, number][][]): ParcelsBuilder {
    this.parcel.geometry = {
      type: PolygonGeoJSONTypeEnum.Polygon,
      coordinates,
    } as PolygonGeoJSON;
    return this;
  }

  public build(): IInflightParcels {
    return this.parcel;
  }
}
