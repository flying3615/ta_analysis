import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { cloneDeep } from "lodash-es";
import { http, HttpResponse, JsonBodyType } from "msw";

import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { mockPlanData, mockPlanDataBuilder } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";

export function createCustomMockPlanData(customise: (data: PlanResponseDTO) => void, baseData = mockPlanData) {
  const customMockPlanData = JSON.parse(JSON.stringify(baseData)) as PlanResponseDTO;
  customise(customMockPlanData);
  return customMockPlanData as JsonBodyType;
}

export function createCustomMockPlanDataWithBuilder(
  customise: (data: PlanDataBuilder) => void,
  baseData = mockPlanDataBuilder,
) {
  const builder = cloneDeep(baseData);
  customise(builder);
  return builder.build();
}

export function customGetHandler(path: RegExp, response: () => JsonBodyType) {
  return http.get(path, () =>
    HttpResponse.json(response(), {
      status: 200,
      statusText: "OK",
    }),
  );
}

export function customPlanMock(response: () => JsonBodyType) {
  return {
    msw: {
      handlers: [customGetHandler(/\/123\/plan$/, response), ...handlers],
    },
  };
}
