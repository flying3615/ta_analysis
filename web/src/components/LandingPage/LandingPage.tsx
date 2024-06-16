import "./LandingPage.scss";

import { LuiIcon, LuiLoadingSpinner, LuiShadow } from "@linzjs/lui";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { planGenApiConfig } from "@/redux/apiConfig.ts";
import { useState } from "react";
import { useLuiModalPrefab } from "@linzjs/windows";
import { prepareDatasetErrorModal } from "@/components/LandingPage/prepareDatasetErrorModal.tsx";
import { unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import { luiColors } from "@/constants.tsx";

const LandingPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [preparingDataset, setPreparingDataset] = useState<boolean>();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const prepareDatasetAndDefineDiagrams = () => {
    if (preparingDataset) {
      console.warn("Already in progress");
      return;
    }
    setPreparingDataset(true);
    new DiagramsControllerApi(planGenApiConfig())
      .postDiagrams({ transactionId: parseInt(transactionId ?? "0") })
      .then(async (response) => {
        setPreparingDataset(false);
        if (response.ok) {
          navigate(`/plan-generation/define-diagrams/${transactionId}`);
        } else {
          await showPrefabModal(prepareDatasetErrorModal(response));
        }
      })
      .catch(async (error) => {
        console.warn(`catch err ${error}`);
        setPreparingDataset(false);
        await showPrefabModal(unhandledErrorModal(error));
      });
  };

  return (
    <>
      <div className="LandingPage-background"></div>
      {preparingDataset && <LuiLoadingSpinner />}
      <div className="LandingPage" ref={modalOwnerRef}>
        <div className="LandingPage-top"></div>
        <div className="LandingPage-inner">
          <div className="LandingPage-title">
            <h1>Plan generation</h1>
            <h5 className="LandingPage-titlePrompt">What would you like to do?</h5>
          </div>
          <div className="LandingPage-options">
            <button
              className="LandingPage-option"
              disabled={preparingDataset}
              onClick={prepareDatasetAndDefineDiagrams}
            >
              <LuiShadow className="LandingPage-optionBtn" dropSize="sm">
                <LuiIcon
                  name="ic_define_diagrams"
                  className="LandingPage-optionIcon"
                  alt="Define diagrams"
                  color={luiColors.sea}
                />
                <p>Define Diagrams</p>
              </LuiShadow>
            </button>
            <Link className="LandingPage-option" to={`/plan-generation/layout-plan-sheets/${transactionId}`}>
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
