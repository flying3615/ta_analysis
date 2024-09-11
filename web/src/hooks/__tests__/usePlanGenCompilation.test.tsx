import { IFileStatusResponse } from "@linz/secure-file-upload";
import { LuiMiniSpinner } from "@linzjs/lui";
import { userEvent } from "@storybook/testing-library";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import React from "react";
import { generatePath, Route } from "react-router-dom";

import { diagrams, pages } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { usePlanGenCompilation } from "@/hooks/usePlanGenCompilation.tsx";
import { Paths } from "@/Paths.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

const mockUploadFile: jest.Mock = jest.fn().mockResolvedValue({} as IFileStatusResponse);

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
describe("usePlanGenCompilation hook", () => {
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

  let compiling: boolean = false;
  let startCompile: () => Promise<void>;
  let CompilationExportCanvas: React.FC;
  const MockComponentWithHook = () => {
    ({ startCompile, CompilationExportCanvas, compiling } = usePlanGenCompilation());

    return (
      <div>
        <CompilationExportCanvas />
        {compiling ? (
          <LuiMiniSpinner size={20} divProps={{ "data-testid": "compilation-loading-spinner" }} />
        ) : (
          <button onClick={() => startCompile()} data-testid="start_export">
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

  it("usePlanGenCompilation should render the exporting canvas and can process exporting", async () => {
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

    await userEvent.click(screen.getByTestId("start_export"));
    expect(compiling).toBeTruthy();
    await waitForElementToBeRemoved(() => screen.queryByTestId("compilation-loading-spinner"));

    expect(compiling).toBeFalsy();
    expect(mockUploadFile).toHaveBeenCalledTimes(3);
  });
});
