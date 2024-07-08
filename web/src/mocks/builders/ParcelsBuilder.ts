import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import {
  IInflightParcels,
  LineStringGeoJSON,
  LineStringGeoJSONTypeEnum,
  PolygonGeoJSON,
  PolygonGeoJSONTypeEnum,
} from "@linz/survey-plan-generation-api-client";

import { CommonBuilder, LatLong, OffsetXY } from "@/mocks/builders/CommonBuilder.ts";

export class ParcelsBuilder extends CommonBuilder<ParcelsBuilder> {
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
  ) {
    super();
  }

  static empty(): ParcelsBuilder {
    return new ParcelsBuilder();
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

  withLineStringCoordinates(coordinates: LatLong[]): ParcelsBuilder {
    this.parcel.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates,
    } as LineStringGeoJSON;
    return this;
  }

  withPolygonCoordinates(coordinates: LatLong[][]): ParcelsBuilder {
    this.parcel.geometry = {
      type: PolygonGeoJSONTypeEnum.Polygon,
      coordinates,
    } as PolygonGeoJSON;
    return this;
  }

  withApproxLineStringMetres(offsetMetres: OffsetXY[]): ParcelsBuilder {
    this.parcel.geometry = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates: offsetMetres.map((segment) => this.transformMetres(segment)),
    } as LineStringGeoJSON;
    return this;
  }

  withApproxPolygonMetres(offsetMetres: OffsetXY[][]): ParcelsBuilder {
    this.parcel.geometry = {
      type: PolygonGeoJSONTypeEnum.Polygon,
      coordinates: offsetMetres.map((ring) => ring.map((segment) => this.transformMetres(segment))),
    } as PolygonGeoJSON;
    return this;
  }

  public build(): IInflightParcels {
    return this.parcel;
  }
}
