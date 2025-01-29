import { MockedFeaturesMap } from "@splitsoftware/splitio/types/splitio";

export enum FEATUREFLAGS {
  SURVEY_PLAN_GENERATION = "survey-plan-generation",
  SURVEY_PLAN_GENERATION_PREVIEW_COMPILATION = "survey-plan-generation-preview-compilation",
  SURVEY_PLAN_GENERATION_AUTO_RECOVERY = "survey-plan-generation-auto-recovery",
  SURVEY_PLAN_GENERATION_PLAN_SHEET_SLICE_V2 = "survey-plan-generation-plansheet-slice-v2",
  SURVEY_PLAN_GENERATION_ABUTTAL_LINES = "survey-plan-generation-abuttal-lines",
  SURVEY_PLAN_GENERATION_LINES_MULTISELECT = "survey-plan-generation-lines-multi-select",
  SURVEY_PLAN_GENERATION_COORDINATES_MULTISELECT = "survey-plan-generation-coordinates-multi-select",
  SURVEY_PLAN_GENERATION_BACKGROUND_ERRORS = "survey-plan-generation-background-errors",
  SURVEY_PLAN_GENERATION_LABEL_MOVE_TO_PAGE = "survey-plan-generation-label-move-to-page",
  SURVEY_PLAN_GENERATION_LINE_MOVE_TO_PAGE = "survey-plan-generation-line-move-to-page",
  SURVEY_PLAN_GENERATION_COMPILE_SERIAL_UPLOAD = "survey-plan-generation-compile-serial-upload",
  SURVEY_PLAN_GENERATION_CHECK_REGENERATION_STATUS = "survey-plan-generation-check-regeneration-status",
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
