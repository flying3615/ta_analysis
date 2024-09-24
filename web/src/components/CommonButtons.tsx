import "./CommonButtons.scss";

import { PanelsContext } from "@linzjs/windows";
import { useContext } from "react";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";
import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel.tsx";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";

export interface CommonButtonsProps {
  transactionId: number;
  lockLabelsForThisPlan?: boolean;
}

export const CommonButtons = ({ transactionId, lockLabelsForThisPlan }: CommonButtonsProps) => {
  const { openPanel } = useContext(PanelsContext);

  const { result: labelPreferencesAllowed, loading: splitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_LABEL_PREFERENCES,
  );

  const labelPreferencesEnabled = labelPreferencesAllowed && !splitLoading;

  return (
    <>
      <div className="CommonButtons__fill" />
      <ActionHeaderButton title="Maintain diagram layers" icon="ic_layers" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton
        title="Label preferences"
        icon="ic_label_settings"
        onClick={() => {
          if (!labelPreferencesEnabled) {
            alert("Coming soon!");
            return;
          }
          openPanel("Label preferences", () => (
            <LabelPreferencesPanel transactionId={transactionId} lockLabelsForThisPlan={lockLabelsForThisPlan} />
          ));
          return false;
        }}
      />
      <ActionHeaderButton title="Feedback" icon="ic_feedback_lightbulb_alt" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Help" icon="ic_help_outline" onClick={() => alert("Not implemented")} />
    </>
  );
};
