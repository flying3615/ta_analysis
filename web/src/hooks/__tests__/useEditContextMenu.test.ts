import { renderHook } from "@testing-library/react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEditContextMenu } from "@/hooks/useEditContextMenu";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { Position } from "@/util/positionUtil";

jest.mock("@/hooks/reduxHooks");
jest.mock("@/hooks/useCytoscapeContext");
jest.mock("@/hooks/usePageLabelEdit");

describe("useEditContextMenu", () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const mockUseAppSelector = useAppSelector as jest.Mock;
  const mockUseCytoscapeContext = useCytoscapeContext as jest.Mock;
  const mockUsePageLabelEdit = usePageLabelEdit as jest.Mock;

  beforeEach(() => {
    mockUseAppSelector.mockReturnValue(PlanMode.SelectLabel);
    mockUseCytoscapeContext.mockReturnValue({ cyto: {} });
    mockUsePageLabelEdit.mockReturnValue({
      pastePageLabels: jest.fn(),
      canPaste: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return menu items with correct properties", () => {
    const { result } = renderHook(() => useEditContextMenu());
    const clickPosition: Position = { x: 100, y: 100 };
    const menuItems = result.current.buildEditMenuItems(clickPosition);

    expect(menuItems).toEqual([
      { title: "Cut", disabled: true },
      { title: "Copy", disabled: true },
      {
        title: "Paste",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        callback: expect.any(Function),
        disabled: false,
      },
    ]);
  });

  it("should call pastePageLabels when Paste is clicked and planMode is SelectLabel", () => {
    const { result } = renderHook(() => useEditContextMenu());
    const clickPosition: Position = { x: 100, y: 100 };
    const menuItems = result.current.buildEditMenuItems(clickPosition);

    const pasteMenuItem = menuItems.find((item) => item.title === "Paste");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    pasteMenuItem?.callback?.();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockUsePageLabelEdit().pastePageLabels).toHaveBeenCalledWith(clickPosition);
  });

  it("should disable Paste when canPasteLabel is false", () => {
    mockUsePageLabelEdit.mockReturnValue({
      pastePageLabels: jest.fn(),
      canPaste: false,
    });

    const { result } = renderHook(() => useEditContextMenu());
    const clickPosition: Position = { x: 100, y: 100 };
    const menuItems = result.current.buildEditMenuItems(clickPosition);

    const pasteMenuItem = menuItems.find((item) => item.title === "Paste");
    expect(pasteMenuItem?.disabled).toBe(true);
  });
});
