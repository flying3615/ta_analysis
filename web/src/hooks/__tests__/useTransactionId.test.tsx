import { screen } from "@testing-library/react";
import { generatePath, Route, useRouteError } from "react-router-dom";

import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

import { useTransactionId } from "../useTransactionId";

describe("useTransactionId hook", () => {
  const TransactionIdComponent = () => {
    const transactionId = useTransactionId();
    return <div>Transaction ID: {transactionId}</div>;
  };

  it("useTransactionId should return the transactionId in the URL", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TransactionIdComponent />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "123" }),
    );
    expect(await screen.findByText("Transaction ID: 123")).toBeInTheDocument();
  });

  it("useTransactionId should throw error when there is no transaction ID in the URL", () => {
    jest.spyOn(console, "error").mockImplementation(jest.fn());
    let error: Error;
    const ErrorBoundary = () => {
      error = useRouteError() as Error;
      return <></>;
    };

    renderCompWithReduxAndRoute(
      <Route element={<TransactionIdComponent />} path="/plan-generation" ErrorBoundary={ErrorBoundary} />,
      "/plan-generation",
    );

    expect(screen.queryByText("Transaction ID: 123")).not.toBeInTheDocument();
    expect(error!.message).toBe("useTransactionId() called when no transaction ID is present in the URL");
  });
});
