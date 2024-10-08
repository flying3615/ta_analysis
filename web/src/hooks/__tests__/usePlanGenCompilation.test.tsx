import { IFileStatusResponse } from "@linz/secure-file-upload";
import { LuiMiniSpinner } from "@linzjs/lui";
import { userEvent } from "@storybook/testing-library";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { generatePath, Route } from "react-router-dom";

import { diagrams, pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { usePlanGenCompilation } from "@/hooks/usePlanGenCompilation.tsx";
import { server } from "@/mocks/mockServer.ts";
import { Paths } from "@/Paths.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";
import { mockStore } from "@/test-utils/store-mock.ts";

const mockUploadFile: jest.Mock = jest.fn().mockResolvedValue({} as IFileStatusResponse);

const mockPreCompileWarning =
  "A full set of digital plans have already been generated for this survey. The existing digital plans will now be " +
  "replaced based on your current diagram layout, attached supporting documents and survey header information. This may take some time. Do you wish to continue?";
const mockInfoCompileSuccess =
  "The plan generation process has been successfully completed and a compilation batch request has been logged. " +
  "When the batch is completed, a copy of the compiled Digital Survey Plan and a Digital Title Plan will be sent to the surveyor and primary contact via online messaging.";
const mockInfoCompileProgress =
  "The plan generation process has been successfully completed. A plan compilation batch request has been logged, and will be run 11:30:00. " +
  "When the batch is completed, a copy of the compiled Digital Survey Plan and Digital Title Plan will be sent to the surveyor and primary contact via online messaging.";
jest.mock("@/util/imageUtil.ts", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/util/imageUtil.ts"),
    convertImageDataTo1Bit: jest.fn().mockResolvedValue({ processedBlob: new Blob(), name: "test.jpg" }),
  };
});
jest.mock("@linz/secure-file-upload", () => {
  class MockFileUploaderClient {
    uploadFile = mockUploadFile;
  }

  return {
    FileUploaderClient: MockFileUploaderClient,
  };
});

jest.mock("@/util/imageUtil.ts", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/util/imageUtil.ts"),
    convertImageDataTo1Bit: jest.fn().mockResolvedValue({ processedBlob: new Blob(), name: "test.jpg" }),
  };
});

describe("usePlanGenCompilation hook", () => {
  const planSheetsState = {
    ...mockStore.planSheets,
    diagrams: diagrams,
    pages: pages,
  };

  let compiling: boolean = false;
  let startCompile: (savePlan: () => Promise<void>) => Promise<void>;
  let CompilationExportCanvas: React.FC;
  const MockComponentWithHook = () => {
    ({ startCompile, CompilationExportCanvas, compiling } = usePlanGenCompilation());

    return (
      <div>
        <CompilationExportCanvas />
        {compiling ? (
          <LuiMiniSpinner size={20} divProps={{ "data-testid": "compilation-loading-spinner" }} />
        ) : (
          <button onClick={() => void startCompile(jest.fn())} data-testid="start_compile">
            Start Export
          </button>
        )}
      </div>
    );
  };

  beforeEach(() => {
    jest.spyOn(Promise, "all").mockImplementation(() => Promise.resolve([]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("usePlanGenCompilation saves unsaved changes, runs a pre plan check, continues with compile and displays confirmation", async () => {
    server.use(http.put(/\/123\/plan-update$/, () => HttpResponse.text(null, { status: 200 })));
    renderCompWithReduxAndRoute(
      <Route element={<MockComponentWithHook />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: planSheetsState,
        },
      },
    );
    expect(compiling).toBeFalsy();
    await userEvent.click(screen.getByTestId("start_compile"));
    //Not checking save call here in tests, as the save process will be refactored in future and test will be updated accordingly
    //TODO: https://toitutewhenua.atlassian.net/browse/SJ-1706

    expect(await screen.findByText(mockPreCompileWarning)).toBeInTheDocument();
    expect(await screen.findByText("Yes")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Yes"));
    expect(await screen.findByText(mockPreCompileWarning)).not.toBeInTheDocument();
    expect(mockUploadFile).toHaveBeenCalledTimes(0);
    expect(await screen.findByText("Plan Generation Completed!")).toBeInTheDocument();
    expect(await screen.findByText(mockInfoCompileSuccess)).toBeInTheDocument();
  });

  it("usePlanGenCompilation saves any unsaved changes, does not displays pre plan check model, continues with compile process and displays confirmation with batch time", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<MockComponentWithHook />} path={Paths.defineDiagrams} />,
      generatePath(Paths.defineDiagrams, { transactionId: "456" }),
      {
        preloadedState: {
          planSheets: planSheetsState,
        },
      },
    );

    expect(compiling).toBeFalsy();
    await userEvent.click(screen.getByTestId("start_compile"));
    //Not checking save call here in tests, as the save process will be refactored in future and test will be updated accordingly
    //TODO: https://toitutewhenua.atlassian.net/browse/SJ-1706
    // expect(mockSavePlan).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(mockPreCompileWarning)).not.toBeInTheDocument();
    expect(await screen.findByText("Plan Generation Completed!")).toBeInTheDocument();
    expect(await screen.findByText(mockInfoCompileProgress)).toBeInTheDocument();
  });
});
