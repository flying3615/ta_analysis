import { accessToken } from "@linz/lol-auth-js";
import { IFileStatusResponse } from "@linz/secure-file-upload";
import { LuiMiniSpinner } from "@linzjs/lui";
import { userEvent } from "@storybook/testing-library";
import { screen } from "@testing-library/react";
import React from "react";
import { generatePath, Route } from "react-router-dom";

import { diagrams, pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { usePlanGenCompilation } from "@/hooks/usePlanGenCompilation";
import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";
import { mockStoreV1 } from "@/test-utils/store-mock";

const mockUploadFile: jest.Mock = jest.fn().mockResolvedValue({} as IFileStatusResponse);

const mockPreCompileWarning =
  "A full set of digital plans have already been generated for this survey. The existing digital plans will now be " +
  "replaced based on your current diagram layout, attached supporting documents and survey header information. This may take some time. Do you wish to continue?";

jest.mock("@/util/imageUtil", () => {
  return {
    __esModule: true,
    ...jest.requireActual<typeof import("@/util/imageUtil")>("@/util/imageUtil"),
    convertImageDataTo1Bit: jest.fn().mockResolvedValue({ processedBlob: new Blob(), name: "test.jpg" }),
  };
});
jest.mock("@linz/lol-auth-js", () => ({
  accessToken: jest.fn(),
}));

jest.mock("@linz/secure-file-upload", () => {
  class MockFileUploaderClient {
    uploadFile = mockUploadFile;
  }

  return {
    FileUploaderClient: MockFileUploaderClient,
  };
});

jest.mock("@/util/imageUtil", () => {
  return {
    __esModule: true,
    ...jest.requireActual<typeof import("@/util/imageUtil")>("@/util/imageUtil"),
    convertImageDataTo1Bit: jest.fn().mockResolvedValue({ processedBlob: new Blob(), name: "test.jpg" }),
  };
});

describe("usePlanGenCompilation hook", () => {
  const planSheetsState = {
    ...mockStoreV1.planSheets,
    diagrams: diagrams,
    pages: pages,
  };

  let compiling: boolean = false;
  let startCompile: () => Promise<void>;
  let CompilationExportCanvas: React.FC;
  const MockComponentWithHook = () => {
    ({ startCompile, CompilationExportCanvas, compiling } = usePlanGenCompilation({
      pageConfigsEdgeData: [],
      pageConfigsNodeData: [],
    }));

    return (
      <div>
        <CompilationExportCanvas />
        {compiling ? (
          <LuiMiniSpinner size={20} divProps={{ "data-testid": "compilation-loading-spinner" }} />
        ) : (
          <button onClick={() => void startCompile()} data-testid="start_compile">
            Start Export
          </button>
        )}
      </div>
    );
  };

  beforeEach(() => {
    jest.spyOn(Promise, "all").mockImplementation(() => Promise.resolve([]));
    (accessToken as jest.Mock).mockResolvedValue("mocked-access-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("usePlanGenCompilation runs a pre plan check, continues with compile and displays confirmation submission toast", async () => {
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
    expect(await screen.findByText(mockPreCompileWarning)).toBeInTheDocument();
    expect(await screen.findByText("Yes")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Yes"));
    expect(await screen.findByText(mockPreCompileWarning)).not.toBeInTheDocument();
    expect(mockUploadFile).toHaveBeenCalledTimes(0);
    expect(await screen.findByText("Plan generation has been initiated successfully.")).toBeInTheDocument();
  });
});
