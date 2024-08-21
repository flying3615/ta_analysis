import { userEvent } from "@storybook/testing-library";
import { screen } from "@testing-library/react";
import { generatePath, Route } from "react-router-dom";

import { diagrams, pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { Paths } from "@/Paths.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";
import PreviewWorker from "@/workers/previewWorker?worker";

import { useCytoscapeCanvasExport } from "../useCytoscapeCanvasExport.tsx";

jest.mock("@/workers/previewWorker?worker");

describe("useCytoscapeCanvasExport hook", () => {
  const planSheetsState = {
    diagrams: diagrams,
    pages: pages,
    activeSheet: PlanSheetType.TITLE,
    hasChanges: false,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 0,
      [PlanSheetType.SURVEY]: 0,
    },
  };

  let startProcessing: (mode: "PREVIEW" | "COMPILATION") => Promise<void>;
  let ExportingCanvas: React.FC;
  let processing: boolean = false;
  let stopProcessing: () => void;
  const MockComponentWithHook = () => {
    ({ startProcessing, ExportingCanvas, processing, stopProcessing } = useCytoscapeCanvasExport({}));

    return (
      <div>
        <ExportingCanvas />
        <button onClick={() => startProcessing("PREVIEW")} data-testid="start_export">
          Start Export
        </button>
        <button onClick={stopProcessing} data-testid="stop_export">
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

  it("useCytoscapeCanvasExport should render the exporting canvas and can process exporting", async () => {
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
    expect(processing).toBeFalsy();

    await userEvent.click(screen.getByTestId("start_export"));
    await screen.findByText("Processing...");
    expect(processing).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const workerInstance = PreviewWorker.mock.instances[0];
    const postMessageSpy = jest.spyOn(workerInstance, "postMessage");
    const workerPostMessage = workerInstance.postMessage;
    expect(workerPostMessage).toHaveBeenCalledTimes(1);
    expect(postMessageSpy).toHaveBeenCalledWith({
      PNGFiles: [{ blob: expect.any(Blob), name: "DSPT-1.png" }],
      type: "PREVIEW",
    });
  });

  it("useCytoscapeCanvasExport support interuption", async () => {
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
    expect(processing).toBeFalsy();

    await userEvent.click(screen.getByTestId("start_export"));
    await screen.findByText("Processing...");
    expect(processing).toBeTruthy();

    await userEvent.click(screen.getByTestId("stop_export"));
    expect(processing).toBeFalsy();
  });
});
