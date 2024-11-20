import { renderHook } from "@testing-library/react";
import cytoscape from "cytoscape";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";

jest.mock("@/hooks/reduxHooks");

describe("usePageLineEdit", () => {
  const mockUseAppSelector = useAppSelector as unknown as jest.Mock;
  const mockUseAppDispatch = useAppDispatch as unknown as jest.Mock;
  const dispatch = jest.fn();

  beforeEach(() => {
    mockUseAppDispatch.mockReturnValue(dispatch);
    mockUseAppSelector.mockReturnValue({
      copiedElements: { elements: [], action: "" },
      activePage: {},
      maxPlanId: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete page lines", () => {
    const { result } = renderHook(() => usePageLineEdit());
    const targets = [
      { data: (key: string) => ({ id: "1_1", lineId: "1", lineType: "userDefined" })[key] } as cytoscape.EdgeSingular,
      { data: (key: string) => ({ id: "1_2", lineId: "1", lineType: "userDefined" })[key] } as cytoscape.EdgeSingular,
      { data: (key: string) => ({ id: "2_1", lineId: "2", lineType: "userDefined" })[key] } as cytoscape.EdgeSingular,
    ];

    result.current.deletePageLines(targets);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { lineIds: ["1", "2"] }, type: "planSheets/removePageLines" }),
    );
  });

  it("should copy page lines", () => {
    const { result } = renderHook(() => usePageLineEdit());
    const targets = [
      { data: (key: string) => ({ id: "1_1", lineId: "1", lineType: "userDefined" })[key] } as cytoscape.EdgeSingular,
    ];

    result.current.copyPageLines(targets);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { action: "COPY", ids: [1], type: "line" },
        type: "planSheets/setCopiedElements",
      }),
    );
  });

  it("should cut page lines", () => {
    const { result } = renderHook(() => usePageLineEdit());
    const targets = [
      { data: (key: string) => ({ id: "1_1", lineId: "1", lineType: "userDefined" })[key] } as cytoscape.EdgeSingular,
    ];

    result.current.cutPageLines(targets);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { action: "CUT", ids: [1], type: "line" },
        type: "planSheets/setCopiedElements",
      }),
    );
  });

  // Paste action will be tested in the storybook
});
