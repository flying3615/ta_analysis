import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";

import { linesBuilderTestOrigin } from "@/mocks/builders/LinesBuilder.ts";

export const mockLines = () =>
  linesBuilderTestOrigin()
    .withDiagram()
    .withId(1)
    .withSymbolType(LinesSymbolType.ABB)
    .withApproxMetres([
      [-25, 75],
      [225, 75],
    ])
    .withDiagram()
    .withId(2)
    .withSymbolType(LinesSymbolType.CT)
    .withApproxMetres([
      [-25, 225],
      [225, 225],
    ])
    .build();
