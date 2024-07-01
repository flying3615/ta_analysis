import { useParams } from "react-router-dom";

export const useTransactionId = (): number => {
  const { transactionId } = useParams();
  if (!transactionId) {
    throw new Error("useTransactionId() called when no transaction ID is present in the URL");
  }
  return parseInt(transactionId);
};
