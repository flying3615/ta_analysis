import Header from "@/components/Header/Header";
import { useParams } from "react-router-dom";

const PlanSheets = () => {
  const { transactionId } = useParams();

  return (
    <>
      <Header transactionId={transactionId} view="Sheets" />
      <div className="PlanSheets" />
    </>
  );
};

export default PlanSheets;
