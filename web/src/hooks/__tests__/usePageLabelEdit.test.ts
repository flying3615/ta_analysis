import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { act, renderHook } from "@testing-library/react";
import cytoscape from "cytoscape";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";

jest.mock("@/hooks/reduxHooks");

describe("usePageLabelEdit", () => {
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

  it("should delete page labels", () => {
    const { result } = renderHook(() => usePageLabelEdit());
    const targets = [
      { data: (key: string) => ({ id: "LAB_1", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key] },
    ] as unknown as cytoscape.NodeSingular[];

    act(() => {
      result.current.deletePageLabels(targets);
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { labelIds: [1] }, type: "planSheets/removePageLabels" }),
    );
  });

  it("should copy page labels", () => {
    const { result } = renderHook(() => usePageLabelEdit());
    const targets = [
      { data: (key: string) => ({ id: "LAB_1", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key] },
    ] as unknown as cytoscape.NodeSingular[];

    act(() => {
      result.current.copyPageLabels(targets);
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { action: "COPY", ids: [1], type: "label" },
        type: "planSheets/setCopiedElements",
      }),
    );
  });

  it("should cut page labels as expected", () => {
    const { result } = renderHook(() => usePageLabelEdit());
    const targets = [
      { data: (key: string) => ({ id: "LAB_1", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key] },
    ] as unknown as cytoscape.NodeSingular[];

    act(() => {
      result.current.cutPageLabels(targets);
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { action: "CUT", ids: [1], type: "label" },
        type: "planSheets/setCopiedElements",
      }),
    );
  });

  it("should return canPaste as true when there are copied elements", () => {
    mockUseAppSelector.mockReturnValueOnce({
      elements: [{ id: "LAB_1" }],
      action: "COPY",
      activePage: {},
      maxPlanId: 1,
    });

    const { result } = renderHook(() => usePageLabelEdit());

    expect(result.current.canPaste).toBe(true);
  });

  it("should return canPaste as false when there are no copied elements", () => {
    const { result } = renderHook(() => usePageLabelEdit());

    expect(result.current.canPaste).toBe(false);
  });
});
