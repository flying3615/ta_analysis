import "./PlanSheets.scss";
import Header from "@/components/Header/Header";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "@/components/Footer/Footer";
import { LuiButton, LuiIcon } from "@linzjs/lui";
import { luiColors } from "@/constants";
import SidePanel from "@/components/SidePanel/SidePanel";
import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";

const PlanSheets = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  return (
    <>
      <Header onNavigate={navigate} transactionId={transactionId} view="Sheets" />
      <div className="PlanSheets">
        <CytoscapeCanvas />
        <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
          <div className="PlanSheetsDiagramOptions">
            <div className="PlanSheetsDiagramOptions-heading">
              <LuiIcon alt="Survey sheet icon" color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
              <h2>Survey sheet diagrams</h2>
            </div>
          </div>
        </SidePanel>
      </div>
      <Footer>
        <LuiButton
          className="lui-button-icon lui-button-icon-only lui-button-tertiary"
          title="Toggle diagrams panel"
          buttonProps={{ "aria-pressed": diagramsPanelOpen }}
          onClick={() => setDiagramsPanelOpen(!diagramsPanelOpen)}
        >
          <LuiIcon alt="Toggle diagrams icon" color={luiColors.sea} name="ic_open_diagrams" size="md" />
        </LuiButton>
      </Footer>
    </>
  );
};

export default PlanSheets;
