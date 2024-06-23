import "./LandingPage.scss";

import { LuiIcon, LuiShadow } from "@linzjs/lui";
import { generatePath, Link, useParams } from "react-router-dom";
import { luiColors } from "@/constants.tsx";
import { Paths } from "@/Paths.ts";

const LandingPage = () => {
  const { transactionId } = useParams();

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
