import "./SurveyDetails.scss";

import { ExternalSurveyInfoDto } from "@/queries/survey";

export const SurveyDetails = ({ surveyInfo }: { surveyInfo: ExternalSurveyInfoDto }) => {
  return (
    <div className="SurveyDetails-container">
      <div className="SurveyDetails-dataset">{`${surveyInfo.datasetSeries} ${surveyInfo.datasetId}`}</div>
    </div>
  );
};
