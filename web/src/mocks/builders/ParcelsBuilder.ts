import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import { ParcelTopologyClassCode } from "@linz/luck-syscodes/build/js/ParcelTopologyClassCode";
import { TypeOfAffectedParcelCode } from "@linz/luck-syscodes/build/js/TypeOfAffectedParcelCode";
import {
  IInflightParcels,
  LineStringGeoJSON,
  LineStringGeoJSONTypeEnum,
  PolygonGeoJSON,
  PolygonGeoJSONTypeEnum,
} from "@linz/survey-plan-generation-api-client";

import { CommonBuilder, LatLong, OffsetXY } from "@/mocks/builders/CommonBuilder";

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
        topologyClass: {
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

  withActionCode(code: TypeOfAffectedParcelCode): ParcelsBuilder {
    const actionCode = TypeOfAffectedParcelCode.lookup(code);
    this.parcel.properties.actionCode = {
      code: actionCode.code,
      description: actionCode.description,
    };
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

  withTopologyClass(code: ParcelTopologyClassCode): ParcelsBuilder {
    const tocCode = ParcelTopologyClassCode.lookup(code);
    this.parcel.properties.topologyClass = {
      code: tocCode.code,
      description: tocCode.description,
    };
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
