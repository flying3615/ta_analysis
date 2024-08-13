import "./PlanKey.scss";

import { LuiBadge } from "@linzjs/lui";
import React from "react";

import { Layer, zIndexes } from "@/components/DefineDiagrams/MapLayers";
import { useGetPlanKeyQuery } from "@/queries/survey";

interface PlanKeyProps {
  transactionId: number;
}

const PlanKey = ({ transactionId }: PlanKeyProps) => {
  const {
    data: planData,
    isLoading: planDataIsLoading,
    error: planDataError,
  } = useGetPlanKeyQuery({
    transactionId,
  });

  if (planDataError || planDataIsLoading || !planData?.surveyNo) return null;
  return (
    <div id="PlanKey" style={{ zIndex: zIndexes[Layer.PLAN_KEY] }}>
      <LuiBadge ariaRoleDescription="CSD Number Reference" variation="default" backgroundFill fillVariation="fill">
        {planData?.surveyNo}
        {planData?.surveyReference && <div className="reference">{planData?.surveyReference}</div>}
      </LuiBadge>
    </div>
  );
};

export default PlanKey;
