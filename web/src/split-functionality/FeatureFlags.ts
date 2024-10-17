import { MockedFeaturesMap } from "@splitsoftware/splitio/types/splitio";

export enum FEATUREFLAGS {
  SURVEY_PLAN_GENERATION = "survey-plan-generation",
  SURVEY_PLAN_GENERATION_DEFINE_DIAGRAMS = "survey-plan-generation-define-diagrams",
  SURVEY_PLAN_GENERATION_PREVIEW_COMPILATION = "survey-plan-generation-preview-compilation",
  SURVEY_PLAN_GENERATION_LABEL_PREFERENCES = "survey-plan-generation-label-preferences",
  SURVEY_PLAN_GENERATION_MAINTAIN_DIAGRAM_LAYERS = "survey-plan-generation-maintain-diagram-layers",
  SURVEY_PLAN_GENERATION_MAINTAIN_LOCKS = "survey-plan-generation-maintain-locks",
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
