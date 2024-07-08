import { screen } from "@testing-library/react";

import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

import { useTransactionId } from "../useTransactionId";

describe("useTransactionId hook", () => {
  const TransactionIdComponent = () => {
    const transactionId = useTransactionId();
    return <div>Transaction ID: {transactionId}</div>;
  };

  it("useTransactionId should return the transactionId in the URL", async () => {
    renderCompWithReduxAndRoute(<TransactionIdComponent />, "/plan-generation/123", "/plan-generation/:transactionId");
    expect(await screen.findByText("Transaction ID: 123")).toBeInTheDocument();
  });

  it("useTransactionId should throw error when there is no transaction ID in the URL", async () => {
    jest.spyOn(console, "error").mockImplementation(jest.fn());
    expect(() => {
      renderCompWithReduxAndRoute(<TransactionIdComponent />, "/plan-generation", "/plan-generation");
    }).toThrow("useTransactionId() called when no transaction ID is present in the URL");
  });
});
