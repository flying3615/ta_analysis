import { useMemo } from "react";
import { FEATUREFLAGS, TREATMENTS } from "@/split-functionality/FeatureFlags.ts";
import { useSplitClient } from "@splitsoftware/splitio-react";

interface IFeatureToggleResult {
  loading: boolean;
  error: boolean;
  result: boolean;
}

/**
 * useFeatureFlags takes the FEATURE from the context enum and returns a result indicating whether the feature is on or not.
 * Optionally, it can take a TREATMENT as a parameter to check the specific treatment,
 * this is useful for multivariant treatments (A-B Testing)
 * e.g. where a treatment can be a variant of 'feature-a' or 'feature-b'
 */

export default function useFeatureFlags(
  feature: FEATUREFLAGS,
  treatment: TREATMENTS = TREATMENTS.ON,
  defaultResult = false,
): IFeatureToggleResult {
  const { client, isReady } = useSplitClient();

  return useMemo(() => {
    return !isReady
      ? {
          loading: true,
          error: false,
          result: defaultResult,
        }
      : {
          loading: false,
          error: false,
          result: client?.getTreatment(feature) === treatment,
        };
  }, [client, isReady, defaultResult, feature, treatment]);
}
