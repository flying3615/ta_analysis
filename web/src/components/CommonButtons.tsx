import "./CommonButtons.scss";

import { ActionHeaderButton } from "@/components/Header/ActionHeaderButton.tsx";

export const CommonButtons = () => {
  return (
    <>
      <div className="CommonButtons__fill" />
      <ActionHeaderButton title="Maintain diagram layers" icon="ic_layers" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Layer preferences" icon="ic_label_settings" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Feedback" icon="ic_feedback_lightbulb_alt" onClick={() => alert("Not implemented")} />
      <ActionHeaderButton title="Help" icon="ic_help_outline" onClick={() => alert("Not implemented")} />
    </>
  );
};
