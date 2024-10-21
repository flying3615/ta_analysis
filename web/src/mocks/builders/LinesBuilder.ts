import {
  LinesResponseDTO,
  LinesResponseDTOLinesInner,
  LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType,
  LineStringGeoJSON,
  LineStringGeoJSONTypeEnum,
} from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

import { CommonBuilder, LatLong, TEST_LOCATION_LAT_LONG } from "@/mocks/builders/CommonBuilder";

export const linesBuilderTestOrigin = () => LinesBuilder.empty().withOrigin(TEST_LOCATION_LAT_LONG);

export class LinesBuilder extends CommonBuilder<LinesBuilder> {
  private linesData = { lines: [] as LinesResponseDTOLinesInner[] };

  static empty(): LinesBuilder {
    return new LinesBuilder();
  }

  withDiagram(): LinesBuilder {
    this.linesData.lines.push({} as LinesResponseDTOLinesInner);
    return this;
  }

  withId(id: number): LinesBuilder {
    if (this.linesData.lines.length === 0) {
      throw new Error("withDiagram must be called before withId");
    }
    last(this.linesData.lines)!.id = id;
    return this;
  }

  withSymbolType(symbolType: LinesSymbolType): LinesBuilder {
    if (this.linesData.lines.length === 0) {
      throw new Error("withDiagram must be called before withDiagramType");
    }
    last(this.linesData.lines)!.symbolType = symbolType;
    return this;
  }

  withApproxMetres(offsetMetres: LatLong[]): LinesBuilder {
    if (this.linesData.lines.length === 0) {
      throw new Error("withDiagram must be called before withApproxMetres");
    }
    const coords = offsetMetres.map((segment) => this.transformMetres(segment));
    last(this.linesData.lines)!.shape = {
      type: LineStringGeoJSONTypeEnum.LineString,
      coordinates: coords,
    } as LineStringGeoJSON;
    return this;
  }

  public build(): LinesResponseDTO {
    return this.linesData;
  }
}
