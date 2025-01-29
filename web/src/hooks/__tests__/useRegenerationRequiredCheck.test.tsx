import { RegenerationStatusDTO } from "@linz/survey-plan-generation-api-client";
import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { regenerationRequiredModal } from "@/components/modals/regenerationRequiredModal";
import { useRegenerationRequiredCheck, UseRegenerationRequiredCheckProps } from "@/hooks/useRegenerationRequiredCheck";
import { server } from "@/mocks/mockServer";

describe("RegenerationRequiredCheck", () => {
  const queryClient = new QueryClient();
  const TestComponent = ({
    regenerateMutate,
    resetRegeneration,
    setIsPlanDataReady,
    showPrefabModal,
    regenComplete,
    transactionId,
    checkRegenerationStatusEnabled,
  }: UseRegenerationRequiredCheckProps) => {
    useRegenerationRequiredCheck({
      transactionId,
      regenComplete,
      setIsPlanDataReady,
      showPrefabModal,
      resetRegeneration,
      regenerateMutate,
      checkRegenerationStatusEnabled,
    });
    return <div>Test</div>;
  };

  const TestComponentWithModalProvider = (props: Omit<UseRegenerationRequiredCheckProps, "showPrefabModal">) => {
    return (
      <LuiModalAsyncContextProvider>
        <TestComponentWithModalProviderInner {...props} />
      </LuiModalAsyncContextProvider>
    );
  };

  const TestComponentWithModalProviderInner = (props: Omit<UseRegenerationRequiredCheckProps, "showPrefabModal">) => {
    const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
    return (
      <div ref={modalOwnerRef}>
        <TestComponent {...props} showPrefabModal={showPrefabModal}></TestComponent>
      </div>
    );
  };

  const originalAddEventListener = window.addEventListener;

  beforeEach(() => {
    jest.spyOn(window, "addEventListener").mockImplementation((...args) => {
      const [eventType, callback] = args;
      if (eventType === "visibilitychange" && typeof callback === "function") {
        callback({
          type: "visibilitychange",
        } as unknown as Event);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.addEventListener = originalAddEventListener;
  });

  it("Show modal is called when a visibility event is fired and the plan requires regeneration", async () => {
    const transactionId = 12345;
    const regenerationStatus: RegenerationStatusDTO = {
      isRegenRequired: true,
    };
    server.use(
      http.get(/\/12345\/plan-regenerate$/, () =>
        HttpResponse.json(regenerationStatus, { status: 200, statusText: "OK" }),
      ),
    );
    const resetMock = jest.fn();
    const mutateMock = jest.fn();
    const setIsPlanDataReady = jest.fn();
    const showPrefabModal = jest.fn();
    // when the hook is run inside a component and registers its even listener the call back will immediately be called with
    // an event of type visibilitychange
    const hookProps: UseRegenerationRequiredCheckProps = {
      transactionId,
      regenComplete: true,
      setIsPlanDataReady,
      showPrefabModal,
      regenerateMutate: mutateMock,
      resetRegeneration: resetMock,
      checkRegenerationStatusEnabled: true,
    };
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent {...hookProps} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(showPrefabModal).toHaveBeenCalled());
    expect(showPrefabModal).toHaveBeenCalledWith(regenerationRequiredModal());
  });

  it("Shows regeneration required modal and mutates regeneration when modal has been dismissed", async () => {
    const transactionId = 12345;
    const regenerationStatus: RegenerationStatusDTO = {
      isRegenRequired: true,
    };
    server.use(
      http.get(/\/12345\/plan-regenerate$/, () =>
        HttpResponse.json(regenerationStatus, { status: 200, statusText: "OK" }),
      ),
    );
    const resetMock = jest.fn();
    const mutateMock = jest.fn();
    const setIsPlanDataReady = jest.fn();
    // when the hook is run inside a component and registers its even listener the call back will immediately be called with
    // an event of type visibilitychange
    const hookProps: Omit<UseRegenerationRequiredCheckProps, "showPrefabModal"> = {
      transactionId,
      regenComplete: true,
      setIsPlanDataReady,
      regenerateMutate: mutateMock,
      resetRegeneration: resetMock,
      checkRegenerationStatusEnabled: true,
    };
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponentWithModalProvider {...hookProps} />
      </QueryClientProvider>,
    );
    const modalDismissButton = await screen.findByText("Regenerate plan sheets");
    expect(modalDismissButton).toBeInTheDocument();
    await userEvent.click(modalDismissButton);
    await waitFor(() => expect(resetMock).toHaveBeenCalled());
    expect(mutateMock).toHaveBeenCalled();
    expect(setIsPlanDataReady).toHaveBeenCalled();
    expect(setIsPlanDataReady).toHaveBeenCalledWith(false);
  });
});
