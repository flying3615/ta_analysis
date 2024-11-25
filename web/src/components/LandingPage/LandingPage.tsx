import "./LandingPage.scss";

import { LuiButton, LuiIcon, LuiShadow } from "@linzjs/lui";
import { IconName } from "@linzjs/lui/dist/components/LuiIcon/LuiIcon";
import { PanelsContext } from "@linzjs/windows";
import { PropsWithChildren, useContext } from "react";
import { generatePath, Link } from "react-router-dom";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton";
import { LabelPreferencesPanel } from "@/components/LabelPreferencesPanel/LabelPreferencesPanel";
import { MaintainDiagramsPanel } from "@/components/MaintainDiagramsPanel/MaintainDiagramsPanel";
import { luiColors } from "@/constants";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { useSurveyInfoQuery } from "@/queries/survey";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { getHelpUrl, hostProtoForApplication } from "@/util/httpUtil";

interface BigButtonProps {
  icon: IconName;
  path?: string;
  onClick?: () => void;
}

const BigButton = ({ icon, path, children, onClick }: PropsWithChildren<BigButtonProps>) => (
  <Link className="LandingPage-option" to={path ?? ""} onClick={onClick}>
    <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
      <LuiIcon name={icon} className="LandingPage-optionIcon" alt="" color={luiColors.sea} />
      <p>{children}</p>
    </LuiShadow>
  </Link>
);

const LandingPage = () => {
  const transactionId = useTransactionId();
  const { data: surveyInfo } = useSurveyInfoQuery({ transactionId });

  const { openPanel } = useContext(PanelsContext);

  const { result: labelPreferencesAllowed, loading: labelPrefsSplitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_LABEL_PREFERENCES,
  );

  const { result: maintainDiagramsAllowed, loading: maintainSplitLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_DIAGRAM_LAYERS,
  );

  return (
    <div className="LandingPage">
      <header className="Header">
        <LuiButton
          href={`${hostProtoForApplication(8080)}/survey/${transactionId}`}
          level="tertiary"
          className="lui-button-centre-icon"
        >
          <LuiIcon color="teal" size="sm" name="ic_arrow_back_ios" alt="Back to Survey Capture Icon" />
          Back to Survey Capture
        </LuiButton>
        <div className="CommonButtons__fill" />
        <ActionHeaderButton title="Help" icon="ic_help_outline" href={getHelpUrl()} openInNewTab={true} />
      </header>
      <div className="LandingPage-inner">
        <div className="LandingPage-title">
          <h1>Plan generation</h1>
          <h2 className="LandingPage-titlePrompt" title={surveyInfo?.description}>
            {surveyInfo?.datasetSeries}&#160;{surveyInfo?.datasetId}
          </h2>
        </div>
        <div className="LandingPage-options">
          <div className="LandingPage-options-row">
            <BigButton icon="ic_define_diagrams" path={generatePath(Paths.defineDiagrams, { transactionId })}>
              Define Diagrams
            </BigButton>
            <BigButton icon="ic_layout_plan_sheets" path={generatePath(Paths.layoutPlanSheets, { transactionId })}>
              Layout Plan Sheets
            </BigButton>
          </div>
          <div className="LandingPage-options-row">
            <BigButton
              icon="ic_layers"
              onClick={() => {
                if (maintainSplitLoading) return;
                if (!maintainDiagramsAllowed) {
                  alert("Coming soon!");
                  return;
                }
                openPanel("Maintain diagram layers", () => <MaintainDiagramsPanel transactionId={transactionId} />);
              }}
            >
              Maintain diagram layers
            </BigButton>

            <BigButton
              icon="ic_label_settings"
              onClick={() => {
                if (labelPrefsSplitLoading) return;
                if (!labelPreferencesAllowed) {
                  alert("Coming soon!");
                  return;
                }
                openPanel("Label preferences", () => <LabelPreferencesPanel transactionId={transactionId} />);
              }}
            >
              Label preferences
            </BigButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
