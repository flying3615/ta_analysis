import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { screen, waitFor } from "@testing-library/react";
import { generatePath, Route } from "react-router-dom";

import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { server } from "@/mocks/mockServer";
import { Paths } from "@/Paths";
import { useCreateAndMaintainLock } from "@/queries/useCreateAndMaintainLock";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

const TestComponent = () => {
  useCreateAndMaintainLock();

  return <div></div>;
};

const TestWrapper = () => (
  <MockUserContextProvider user={singleFirmUserExtsurv1} initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}>
    <TestComponent />
  </MockUserContextProvider>
);

describe("useCreateAndMaintainLock hook", () => {
  const requestSpy = jest.fn();

  beforeAll(() => {
    server.events.on("request:start", requestSpy);
  });

  beforeEach(() => {
    requestSpy.mockReset();
  });

  afterAll(() => {
    server.events.removeListener("request:start", requestSpy);
  });

  server.events.on("request:start", requestSpy);

  it("should lock on load", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TestWrapper />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "123" }),
    );

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            method: "GET",
            url: "http://localhost/v1/surveys/api/survey/123/locks",
          }) as unknown,
        }),
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/v1/surveys/api/survey/123/locks/2100000/lastUsed",
        }) as unknown,
      }),
    );
  });

  it("should skip lastUsed(extend) if lock recent", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TestWrapper />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "12345" }),
    );

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            method: "GET",
            url: "http://localhost/v1/surveys/api/survey/12345/locks",
          }) as unknown,
        }),
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(requestSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/v1/surveys/api/survey/12345/locks/2100000/lastUsed",
        }) as unknown,
      }),
    );
  });

  it("should show error if locked", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TestWrapper />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "5000061" }),
    );

    await waitFor(async () => {
      expect(await screen.findByText("This CSD is being used by extsurv4.")).toBeTruthy();
    });
  });

  it("should show error if locks is down", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TestWrapper />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "666" }),
    );

    await waitFor(async () => {
      expect(await screen.findByText("An unknown error has prevented the locks from loading.")).toBeTruthy();
    });
  });

  it("should show error if lastUsed fails", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<TestWrapper />} path={Paths.root} />,
      generatePath(Paths.root, { transactionId: "667" }),
    );

    await waitFor(async () => {
      expect(await screen.findByText("An unknown error has prevented the locks from loading.")).toBeTruthy();
    });
  });
});
