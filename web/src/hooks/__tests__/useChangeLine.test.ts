import { EdgeSingular } from "cytoscape";

describe("useChangeLine", () => {
  test("should set line hide", async () => {
    const dispatch = jest.fn();
    const setLineHide = jest.fn();
    const useAppDispatch = jest.fn().mockReturnValue(dispatch);
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppDispatch }));
    jest.doMock("@/redux/planSheets/planSheetsSlice.ts", () => ({ setLineHide }));

    const target = { data: (key: string) => ({ id: "1_2", lineId: "1" })[key] } as EdgeSingular;

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    const useChangeLine = require("@/hooks/useChangeLine.ts").useChangeLine;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const changeLine = useChangeLine();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    changeLine(target, true);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(setLineHide).toHaveBeenCalledWith({ id: "1", hide: true });
  });
});
