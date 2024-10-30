import { EdgeSingular } from "cytoscape";

describe("useDeleteLines", () => {
  test("should delete lines", () => {
    const dispatch = jest.fn();
    const removePageLines = jest.fn();
    const useAppDispatch = jest.fn().mockReturnValue(dispatch);
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppDispatch }));
    jest.doMock("@/redux/planSheets/planSheetsSlice.ts", () => ({ removePageLines }));

    const targets = [
      { data: (key: string) => ({ id: "1_1", lineId: "1", lineType: "userDefined" })[key] } as EdgeSingular,
      { data: (key: string) => ({ id: "1_2", lineId: "1", lineType: "userDefined" })[key] } as EdgeSingular,
      { data: (key: string) => ({ id: "1_3", lineId: "1", lineType: "userDefined" })[key] } as EdgeSingular,
      { data: (key: string) => ({ id: "2_1", lineId: "2", lineType: "userDefined" })[key] } as EdgeSingular,
      { data: (key: string) => ({ id: "2_2", lineId: "2", lineType: "userDefined" })[key] } as EdgeSingular,
      { data: (key: string) => ({ id: "3_1", lineId: "3", lineType: "observation" })[key] } as EdgeSingular,
    ];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const useDeleteLines = (require("@/hooks/useDeleteLines") as typeof import("@/hooks/useDeleteLines"))
      .useDeleteLines;
    const deletePageLines = useDeleteLines();
    deletePageLines(targets);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(removePageLines).toHaveBeenCalledWith({ lineIds: ["1", "2"] });
  });
});
