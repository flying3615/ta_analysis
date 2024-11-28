import "./CommonButtons.scss";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton";
import { getHelpUrl } from "@/util/httpUtil";

export const CommonButtons = () => {
  const feedbackUrl = "https://forms.office.com/r/db204DXw62";
  return (
    <>
      <ActionHeaderButton title="Feedback" icon="ic_feedback_lightbulb_alt" href={feedbackUrl} openInNewTab={true} />
      <ActionHeaderButton title="Help" icon="ic_help_outline" href={getHelpUrl()} openInNewTab={true} />
    </>
  );
};
