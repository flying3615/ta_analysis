import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";

describe("unhandledErrorModal", () => {
  test("returns the prefab config", () => {
    const config = unhandledErrorModal(new Error("A test error"));

    expect(config.level).toBe("error");
    expect(config.title).toBe("Unexpected error");
    expect(config.className).toBe("UnhandledErrorModal");
    expect(config.closeOnOverlayClick).toBeTruthy();
    expect(config.buttons).toHaveLength(1);
    expect(config.buttons?.[0]?.title).toBe("Dismiss");
    expect(config.buttons?.[0]?.level).toBe("tertiary");
  });

  const TestModal = (props: { error: Error }) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

    useEffect(() => {
      showPrefabModal(unhandledErrorModal(props.error));
    }, [props.error, showPrefabModal]);

    return <div ref={modalOwnerRef} />;
  };

  test("generates a UX via showPrefabModal for an API error", async () => {
    render(
      <LuiModalAsyncContextProvider>
        <TestModal
          error={
            {
              message: "Test error",
              response: {
                status: 404,
                statusText: "not found",
                url: "http://api/wrong.txt",
              },
            } as unknown as Error
          }
        />
      </LuiModalAsyncContextProvider>,
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.getByText(/Refresh the page and if the problem persists, call us on/)).toBeInTheDocument();
    const expandClick = screen.getByLabelText("expand");
    fireEvent.click(expandClick);

    expect(await screen.findByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Detailed error information")).toBeInTheDocument();
    expect(screen.queryByText("Stack trace:")).not.toBeInTheDocument();
    expect(screen.getByText("API Status:")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("API URL:")).toBeInTheDocument();
    expect(screen.getByText("http://api/wrong.txt")).toBeInTheDocument();
  });

  test("generates a UX via showPrefabModal for a non-API error", async () => {
    render(
      <LuiModalAsyncContextProvider>
        <TestModal error={new Error("Test error")} />
      </LuiModalAsyncContextProvider>,
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.getByText(/Refresh the page and if the problem persists, call us on/)).toBeInTheDocument();
    const expandClick = screen.getByLabelText("expand");
    fireEvent.click(expandClick);

    expect(await screen.findByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Detailed error information")).toBeInTheDocument();
    expect(screen.getByText("Stack trace:")).toBeInTheDocument();
  });
});

describe("errorFromSerializedError", () => {
  test("creates an Error from a SerializedError", () => {
    const error = errorFromSerializedError({
      code: "404",
      message: "Not found",
    });

    expect(error.name).toBe("Not found");
    expect(error.message).toBe("Not found");
    expect(error.response?.status).toBe("404");
  });
});
