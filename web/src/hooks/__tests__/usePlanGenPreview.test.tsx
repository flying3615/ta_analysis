import { userEvent } from "@storybook/testing-library";
import { screen } from "@testing-library/react";
import { generatePath, Route } from "react-router-dom";

import { diagrams, pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";
import { mockStore } from "@/test-utils/store-mock";
import PreviewWorker from "@/workers/previewWorker?worker";

import { usePlanGenPreview } from "../usePlanGenPreview";

jest.mock("@/workers/previewWorker?worker");

describe("usePlanGenPreview hook", () => {
  const planSheetsState = {
    ...mockStore.planSheets,
    diagrams: diagrams,
    pages: pages,
  };

  let startPreview: () => Promise<void>;
  let PreviewExportCanvas: React.FC;
  let previewing: boolean = false;
  let stopPreviewing: () => void;
  const MockComponentWithHook = () => {
    ({ startPreview, PreviewExportCanvas, previewing, stopPreviewing } = usePlanGenPreview({
      transactionId: 123,
      surveyInfo: mockSurveyInfo,
    }));

    return (
      <div>
        <PreviewExportCanvas />
        <button onClick={() => void startPreview()} data-testid="start_export">
          Start Export
        </button>
        <button onClick={stopPreviewing} data-testid="stop_export">
          Stop Export
        </button>
      </div>
    );
  };

  beforeEach(() => {
    jest.spyOn(Promise, "all").mockImplementation(() => Promise.resolve([]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("usePlanGenPreview should render the exporting canvas and can process exporting", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<MockComponentWithHook />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: planSheetsState,
        },
      },
    );
    expect(await screen.findByTestId("cy-exporting-canvas")).toBeInTheDocument();
    expect(previewing).toBeFalsy();

    await userEvent.click(screen.getByTestId("start_export"));
    await screen.findByText("Processing...");
    expect(previewing).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const workerInstance = PreviewWorker.mock.instances[0];
    const postMessageSpy = jest.spyOn(workerInstance, "postMessage");
    const workerPostMessage = workerInstance.postMessage;
    expect(workerPostMessage).toHaveBeenCalledTimes(1);
    expect(postMessageSpy).toHaveBeenCalledWith({
      ImageFiles: [{ blob: expect.any(Blob), name: "DTPS-1.jpg" }],
      type: "PREVIEW",
    });
  });

  it("usePlanGenPreview support interruption", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<MockComponentWithHook />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: planSheetsState,
        },
      },
    );
    expect(await screen.findByTestId("cy-exporting-canvas")).toBeInTheDocument();
    expect(previewing).toBeFalsy();

    await userEvent.click(screen.getByTestId("start_export"));
    await screen.findByText("Processing...");
    expect(previewing).toBeTruthy();

    await userEvent.click(screen.getByTestId("stop_export"));
    expect(previewing).toBeFalsy();
  });
});
