import "./CommonButtons.scss";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton";
import { getHelpUrl } from "@/util/httpUtil";

export const CommonButtons = () => {
  return (
    <>
      <ActionHeaderButton title="Feedback" icon="ic_feedback_lightbulb_alt" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Help" icon="ic_help_outline" href={getHelpUrl()} openInNewTab={true} />
    </>
  );
};
