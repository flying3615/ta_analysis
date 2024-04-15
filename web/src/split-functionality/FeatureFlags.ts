import { MockedFeaturesMap } from "@splitsoftware/splitio/types/splitio";

export enum FEATUREFLAGS {
  SURVEY_PLAN_GENERATION = "survey-plan-generation",
}

export enum TREATMENTS {
  OFF = "off",
  ON = "on",
}

type FeatureFlagsStrings = keyof typeof FEATUREFLAGS;

export function mockedFeatureFlagsOn(): MockedFeaturesMap {
  return Object.keys(FEATUREFLAGS).reduce((map, key) => {
    return {
      ...map,
      [FEATUREFLAGS[key as FeatureFlagsStrings]]: {
        treatment: TREATMENTS.ON,
        config: null,
      },
    };
  }, {} as MockedFeaturesMap);
}
