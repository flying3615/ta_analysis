import { useEffect, useState } from "react";

import { usePlanCheckQuery } from "@/queries/planCheck.ts";
import { useRegeneratePlanMutation } from "@/queries/regeneratePlan.ts";

interface CheckAndGenerateResult {
  isRegenerating: boolean;
  regenerateDoneOrNotNeeded: boolean;
  planCheckError: Error | null;
  regeneratePlanError: Error | null;
}

export const useCheckAndRegeneratePlan = (transactionId: number): CheckAndGenerateResult => {
  const [regenerateDoneOrNotNeeded, setRegenerateDoneOrNotNeeded] = useState<boolean>(false);

  const { data: planCheckResponse, error: planCheckError } = usePlanCheckQuery({
    transactionId,
  });

  const {
    mutate: regeneratePlan,
    error: regeneratePlanError,
    isSuccess: regeneratePlanIsSuccess,
    isPending: isRegenerating,
  } = useRegeneratePlanMutation({ transactionId });

  useEffect(() => {
    if (regeneratePlanIsSuccess) {
      setRegenerateDoneOrNotNeeded(true);
    }
  }, [regeneratePlanIsSuccess]);

  useEffect(() => {
    if (regeneratePlanError) {
      setRegenerateDoneOrNotNeeded(false);
    }
  }, [regeneratePlanError]);

  useEffect(() => {
    if (planCheckResponse?.refreshRequired) {
      regeneratePlan();
    } else if (planCheckResponse?.refreshRequired === false) {
      setRegenerateDoneOrNotNeeded(true);
    }
  }, [planCheckResponse, regeneratePlan]);

  return {
    isRegenerating,
    regenerateDoneOrNotNeeded,
    planCheckError,
    regeneratePlanError,
  };
};
