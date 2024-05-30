import "./PlanSheets.scss";
import Header from "@/components/Header/Header";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "@/components/Footer/Footer";
import { LuiButton, LuiIcon, LuiLoadingSpinner } from "@linzjs/lui";
import { luiColors } from "@/constants";
import SidePanel from "@/components/SidePanel/SidePanel";
import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import {
  fetchPlan,
  getDiagrams,
  getEdgeDataForPage,
  getNodeDataForPage,
  isPlanFetching,
  getPlanError,
} from "@/redux/plan/planSlice.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";

const PlanSheets = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  const nodeData = useAppSelector((state) => getNodeDataForPage(state, 1));
  const edgeData = useAppSelector((state) => getEdgeDataForPage(state, 1));
  const diagrams = useAppSelector((state) => getDiagrams(state));
  const planDataIsFetching = useAppSelector((state) => isPlanFetching(state));
  const planDataError = useAppSelector((state) => getPlanError(state));

  if (!transactionId) {
    throw new Error("Transaction ID is missing");
  }

  useEffect(() => {
    dispatch(fetchPlan(parseInt(transactionId)));
  }, [dispatch, transactionId]);

  if (planDataIsFetching) return <LuiLoadingSpinner />;

  return (
    <>
      {planDataError && <p>Error fetching plan data</p>}
      <Header onNavigate={navigate} transactionId={transactionId} view="Sheets" />
      <div className="PlanSheets">
        <SidePanel align="left" isOpen={diagramsPanelOpen} data-testid="diagrams-sidepanel">
          <div className="PlanSheetsDiagramOptions">
            <div className="PlanSheetsDiagramOptions-heading">
              <LuiIcon alt="Survey sheet icon" color={luiColors.fuscous} name="ic_survey_sheet" size="md" />
              <h2>Survey sheet diagrams</h2>
            </div>
          </div>
        </SidePanel>
        <CytoscapeCanvas nodeData={nodeData} edgeData={edgeData} diagrams={diagrams} />
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
