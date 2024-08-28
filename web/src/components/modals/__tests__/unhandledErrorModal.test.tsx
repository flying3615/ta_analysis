import { ResponseError } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";

import {
  errorFromResponseError,
  errorFromSerializedError,
  unhandledErrorModal,
} from "@/components/modals/unhandledErrorModal.tsx";

jest.mock("@linz/survey-plan-generation-api-client", () => ({
  ResponseError: jest.fn(),
}));

describe("unhandledErrorModal", () => {
  const TestModal = (props: { error: Error }) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

    useEffect(() => {
      showPrefabModal(unhandledErrorModal(props.error));
    }, [props.error, showPrefabModal]);

    return <div ref={modalOwnerRef} />;
  };
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
      response: {
        status: 404,
        statusText: "Not found",
        url: "http://api/wrong.txt",
      },
    });

    expect(error.name).toBe("Not found");
    expect(error.message).toBe("Not found");
    expect(error.response?.status).toBe("404");
    expect(error.response?.statusText).toBe("Not found");
    expect(error.response?.url).toBe("http://api/wrong.txt");
  });
});

describe("errorFromResponseError", () => {
  it("should return an ErrorWithResponse object", async () => {
    const mockJson = jest.fn().mockResolvedValue({
      errors: [{ description: "Error description" }],
    });
    const error = {
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        json: mockJson,
        status: 400,
      },
    } as unknown as ResponseError;

    const result = await errorFromResponseError(error);

    expect(result).toEqual({
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 400,
        statusText: "Error description",
      },
    });
  });

  it("should handle errors without a description", async () => {
    const mockJson = jest.fn().mockResolvedValue({
      errors: [],
    });
    const error = {
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        json: mockJson,
        status: 400,
      },
    } as unknown as ResponseError;

    const result = await errorFromResponseError(error);

    expect(result).toEqual({
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 400,
        statusText: undefined,
      },
    });
  });

  it("should return an ErrorWithResponse object with default values", async () => {
    const mockJson = jest.fn().mockResolvedValue({
      errors: [{ description: "Error description" }],
    });
    const error = {
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        json: mockJson,
        status: 400,
      },
    } as unknown as ResponseError;

    const result = await errorFromResponseError(error);

    expect(result).toEqual({
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 400,
        statusText: "Error description",
      },
    });
  });

  it("should override default values with customErrorResponse", async () => {
    const mockJson = jest.fn().mockResolvedValue({
      errors: [{ description: "Error description" }],
    });
    const error = {
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        json: mockJson,
        status: 400,
      },
    } as unknown as ResponseError;

    const customErrorResponse = {
      message: "Custom error message",
      name: "Custom error name",
      stack: "Custom error stack",
      response: {
        status: 500,
        statusText: "Custom status text",
      },
    };

    const result = await errorFromResponseError(error, customErrorResponse);

    expect(result).toEqual({
      message: "Custom error message",
      name: "Custom error name",
      stack: "Custom error stack",
      response: {
        status: 500,
        statusText: "Custom status text",
      },
    });
  });

  it("should handle partial customErrorResponse", async () => {
    const mockJson = jest.fn().mockResolvedValue({
      errors: [{ description: "Error description" }],
    });
    const error = {
      message: "Error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        json: mockJson,
        status: 400,
      },
    } as unknown as ResponseError;

    const customErrorResponse = {
      message: "Custom error message",
    };

    const result = await errorFromResponseError(error, customErrorResponse);

    expect(result).toEqual({
      message: "Custom error message",
      name: "Error name",
      stack: "Error stack",
      response: {
        status: 400,
        statusText: "Error description",
      },
    });
  });
});
