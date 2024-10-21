import {
  LabelsResponseDTO,
  LabelsResponseDTOLabelsInner,
  PointGeoJSON,
  PointGeoJSONTypeEnum,
} from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

import { CommonBuilder, OffsetXY, TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder";

export const labelsBuilderTestOrigin = () => LabelsBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

export class LabelsBuilder extends CommonBuilder<LabelsBuilder> {
  private labelsData = { labels: [] as LabelsResponseDTOLabelsInner[] };

  static empty(): LabelsBuilder {
    return new LabelsBuilder();
  }

  withLabel(): LabelsBuilder {
    this.labelsData.labels.push({} as LabelsResponseDTOLabelsInner);
    return this;
  }

  withId(id: number): LabelsBuilder {
    if (this.labelsData.labels.length === 0) {
      throw new Error("withLabel must be called before withId");
    }
    last(this.labelsData.labels)!.id = id;
    return this;
  }

  withLabelType(type: string): LabelsBuilder {
    if (this.labelsData.labels.length === 0) {
      throw new Error("withLabel must be called before withLabelType");
    }
    last(this.labelsData.labels)!.diagramType = type;
    return this;
  }

  withLabelName(name: string): LabelsBuilder {
    if (this.labelsData.labels.length === 0) {
      throw new Error("withLabelName must be called before withLabelType");
    }
    last(this.labelsData.labels)!.name = name;
    return this;
  }

  withApproxMetres(offsetMetres: OffsetXY): LabelsBuilder {
    if (this.labelsData.labels.length === 0) {
      throw new Error("withLabel must be called before withApproxMetres");
    }
    last(this.labelsData.labels)!.shape = {
      type: PointGeoJSONTypeEnum.Point,
      coordinates: this.transformMetres(offsetMetres),
    } as PointGeoJSON;
    return this;
  }

  public build(): LabelsResponseDTO {
    return this.labelsData;
  }
}
