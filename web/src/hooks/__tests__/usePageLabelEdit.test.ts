import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { renderHook } from "@testing-library/react";
import cytoscape from "cytoscape";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";

jest.mock("@/hooks/reduxHooks");
jest.mock("@/hooks/useCytoscapeContext");

describe("usePageLabelEdit", () => {
  const mockUseAppSelector = useAppSelector as unknown as jest.Mock;
  const mockUseAppDispatch = useAppDispatch as unknown as jest.Mock;
  const mockUseCytoscapeContext = useCytoscapeContext as jest.Mock;

  const dispatch = jest.fn();

  beforeEach(() => {
    mockUseAppDispatch.mockReturnValue(dispatch);
    mockUseCytoscapeContext.mockReturnValue({ cyto: {} });
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

    result.current.deletePageLabels(targets);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { labelIds: [1] }, type: "planSheets/removePageLabels" }),
    );
  });

  it("should copy page labels", () => {
    const { result } = renderHook(() => usePageLabelEdit());
    const targets = [
      { data: (key: string) => ({ id: "LAB_1", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key] },
    ] as unknown as cytoscape.NodeSingular[];

    result.current.copyPageLabels(targets);

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

    result.current.cutPageLabels(targets);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { action: "CUT", ids: [1], type: "label" },
        type: "planSheets/setCopiedElements",
      }),
    );
  });

  // Paste action will be tested in the storybook
});
