import "./CommonButtons.scss";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";

export const CommonButtons = () => {
  return (
    <>
      <ActionHeaderButton title="Feedback" icon="ic_feedback_lightbulb_alt" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Help" icon="ic_help_outline" onClick={() => alert("Not implemented")} />
    </>
  );
};
