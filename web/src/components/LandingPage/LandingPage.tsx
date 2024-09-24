import "./LandingPage.scss";

import { LuiIcon, LuiShadow } from "@linzjs/lui";
import { PanelsContext } from "@linzjs/windows";
import { useContext } from "react";
import { generatePath, Link } from "react-router-dom";

import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel.tsx";
import { luiColors } from "@/constants.tsx";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths.ts";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";

const LandingPage = () => {
  const transactionId = useTransactionId();
  const { openPanel } = useContext(PanelsContext);

  const { result: labelPreferencesAllowed, loading: splitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_LABEL_PREFERENCES,
  );

  const labelPreferencesEnabled = labelPreferencesAllowed && !splitLoading;

  return (
    <>
      <div className="LandingPage-background"></div>
      <div className="LandingPage">
        <div className="LandingPage-top"></div>
        <div className="LandingPage-inner">
          <div className="LandingPage-title">
            <h1>Plan generation</h1>
            <h5 className="LandingPage-titlePrompt">What would you like to do?</h5>
          </div>
          <div className="LandingPage-options">
            <Link className="LandingPage-option" to={generatePath(Paths.defineDiagrams, { transactionId })}>
              <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
                <LuiIcon
                  name="ic_define_diagrams"
                  className="LandingPage-optionIcon"
                  alt="Define diagrams"
                  color={luiColors.sea}
                />
                <p>Define Diagrams</p>
              </LuiShadow>
            </Link>
            <Link className="LandingPage-option" to={generatePath(Paths.layoutPlanSheets, { transactionId })}>
              <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
                <LuiIcon
                  name="ic_layout_plan_sheets"
                  className="LandingPage-optionIcon"
                  alt="Layout plan sheets"
                  color={luiColors.sea}
                />
                <p>Layout Plan Sheets</p>
              </LuiShadow>
            </Link>
          </div>
          <div className="LandingPage-options">
            <Link className="LandingPage-option" onClick={() => alert("Coming soon!")} to="">
              <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
                <LuiIcon
                  name="ic_layers"
                  className="LandingPage-optionIcon"
                  alt="Maintain diagram layers"
                  color={luiColors.sea}
                />
                <p>Maintain diagram layers</p>
              </LuiShadow>
            </Link>
            <Link
              className="LandingPage-option"
              onClick={() => {
                if (!labelPreferencesEnabled) {
                  alert("Coming soon!");
                  return;
                }
                openPanel("Label preferences", () => <LabelPreferencesPanel transactionId={transactionId} />);
                return false;
              }}
              to=""
            >
              <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
                <LuiIcon
                  name="ic_label_settings"
                  className="LandingPage-optionIcon"
                  alt="Label preferences"
                  color={luiColors.sea}
                />
                <p>Label preferences</p>
              </LuiShadow>
            </Link>
          </div>
        </div>
        <div className="LandingPage-footer">
          <LuiIcon name="ic_info_outline" size="md" alt="Info" color="#6b6966" />
          <span className="LandingPage-infoText">
            Find Maintain Diagram Layers and Preferences in Define Diagrams and Layout Plan Sheets
          </span>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
