import "./LandingPage.scss";
import { LuiIcon, LuiShadow } from "@linzjs/lui";
import { Paths } from "@/Paths.ts";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const LuiColorSea = "#007198"; // Need this as a constant

  return (
    <div className="LandingPage">
      <div className={"LandingPage-top"}></div>
      <div className={"LandingPage-inner"}>
        <div className={"LandingPage-title"}>
          <h1>Plan generation</h1>
          <h5 className={"LandingPage-titlePrompt"}>What would you like to do?</h5>
        </div>
        <div className={"LandingPage-options"}>
          <LuiShadow className={"LandingPage-option"} dropSize={"sm"}>
            <Link className={"LandingPage-optionLink"} to={Paths.defineDiagrams}>
              <LuiIcon
                name={"ic_define_diagrams"}
                className={"LandingPage-optionIcon"}
                alt={"Define diagrams"}
                color={LuiColorSea}
              />

              <p>Define Diagrams</p>
            </Link>
          </LuiShadow>
          <LuiShadow className={"LandingPage-option"} dropSize={"sm"}>
            <Link className={"LandingPage-optionLink"} to={Paths.layoutPlanSheets}>
              <LuiIcon
                name={"ic_layout_plan_sheets"}
                className={"LandingPage-optionIcon"}
                alt={"Layout plan sheets"}
                color={LuiColorSea}
              />
              <p>Layout Plan Sheets</p>
            </Link>
          </LuiShadow>
        </div>
      </div>
      <div className={"LandingPage-footer"}>
        <LuiIcon name={"ic_info_outline"} size={"md"} alt={"Info"} color={"#6b6966"} />
        <span className={"LandingPage-infoText"}>
          Find Maintain Diagram Layers and Preferences in Define Diagrams and Layout Plan Sheets
        </span>
      </div>
    </div>
  );
};

export default LandingPage;
