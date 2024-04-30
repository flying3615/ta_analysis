import Header from "@/components/Header/Header";
import { useNavigate, useParams } from "react-router-dom";

const PlanSheets = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Header onNavigate={navigate} transactionId={transactionId} view="Sheets" />
      <div className="PlanSheets" />
    </>
  );
};

export default PlanSheets;
