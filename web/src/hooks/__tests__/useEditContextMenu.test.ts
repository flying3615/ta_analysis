import { renderHook } from "@testing-library/react";

import { useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEditContextMenu } from "@/hooks/useEditContextMenu";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";
import { Position } from "@/util/positionUtil";

jest.mock("@/hooks/reduxHooks");
jest.mock("@/hooks/useCytoscapeContext");
jest.mock("@/hooks/usePageLabelEdit");
jest.mock("@/hooks/usePageLineEdit");

describe("useEditContextMenu", () => {
  const mockUseAppSelector = useAppSelector as unknown as jest.Mock;
  const mockUseCytoscapeContext = useCytoscapeContext as jest.Mock;
  const mockUsePageLabelEdit = usePageLabelEdit as jest.Mock;
  const mockUsePageLineEdit = usePageLineEdit as jest.Mock;

  beforeEach(() => {
    mockUseAppSelector.mockReturnValue({ type: "label", elements: [{ id: 1 }] });
    mockUseCytoscapeContext.mockReturnValue({ cyto: {} });
    mockUsePageLabelEdit.mockReturnValue({
      pastePageLabels: jest.fn(),
    });
    mockUsePageLineEdit.mockReturnValue({
      pastePageLines: jest.fn(),
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

  it("should call pastePageLabels when Paste is clicked and copiedElements type is label", () => {
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

  it("should call pastePageLines when Paste is clicked and copiedElements type is line", () => {
    mockUseAppSelector.mockReturnValue({ type: "line", elements: [{ id: 1 }] });

    const { result } = renderHook(() => useEditContextMenu());
    const clickPosition: Position = { x: 100, y: 100 };
    const menuItems = result.current.buildEditMenuItems(clickPosition);

    const pasteMenuItem = menuItems.find((item) => item.title === "Paste");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    pasteMenuItem?.callback?.();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockUsePageLineEdit().pastePageLines).toHaveBeenCalledWith(clickPosition);
  });

  it("should disable Paste when there are no copied elements", () => {
    mockUseAppSelector.mockReturnValue({ type: "label", elements: [] });

    const { result } = renderHook(() => useEditContextMenu());
    const clickPosition: Position = { x: 100, y: 100 };
    const menuItems = result.current.buildEditMenuItems(clickPosition);

    const pasteMenuItem = menuItems.find((item) => item.title === "Paste");
    expect(pasteMenuItem?.disabled).toBe(true);
  });
});
