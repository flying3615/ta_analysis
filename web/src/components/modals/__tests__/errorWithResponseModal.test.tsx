import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";

import { errorWithResponseModal } from "@/components/modals/errorWithResponseModal";
import { ErrorWithResponse } from "@/components/modals/unhandledErrorModal";

describe("errorWithResponseModal", () => {
  const TestModal = (props: { error: ErrorWithResponse }) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

    useEffect(() => {
      (() => {
        void showPrefabModal(errorWithResponseModal(props.error));
      })();
    }, [props.error, showPrefabModal]);

    return <div ref={modalOwnerRef} />;
  };

  const renderModal = async (error: ErrorWithResponse) => {
    render(
      <LuiModalAsyncContextProvider>
        <TestModal error={error} />
      </LuiModalAsyncContextProvider>,
    );

    expect(await screen.findByText(error.message)).toBeInTheDocument();
  };
  it("should render the modal with default error message", async () => {
    const error: ErrorWithResponse = {
      message: "Default error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 500,
        statusText: "Internal Server Error",
      },
    };

    await renderModal(error);

    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/Internal Server Error/)).toBeInTheDocument();
  });

  it("should render the modal with custom error message", async () => {
    const error: ErrorWithResponse = {
      message: "Custom error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 404,
        statusText: "Not Found",
      },
    };

    await renderModal(error);

    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByText(/Not Found/)).toBeInTheDocument();
  });

  it("should render the modal with default message if response statusText is missing", async () => {
    const error: ErrorWithResponse = {
      message: "Default error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 400,
        statusText: undefined,
      },
    };

    await renderModal(error);

    expect(screen.getByText(/400/)).toBeInTheDocument();
    expect(screen.getByText("Default error message")).toBeInTheDocument();
  });
});
