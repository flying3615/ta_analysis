import { EdgeSingular } from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";

describe("useChangeNode", () => {
  test("should set node as hidden", () => {
    const dispatch = jest.fn();
    const setSymbolHide = jest.fn();
    const useAppDispatch = jest.fn().mockReturnValue(dispatch);

    const lookupSource = jest.fn().mockReturnValue({ id: "1001" });
    const findMarkSymbol = jest.fn().mockReturnValue({ id: "1002" });
    const lookupGraphData = { lookupSource, findMarkSymbol };
    const useAppSelector = jest.fn().mockReturnValue(lookupGraphData);

    jest.doMock("@/modules/plan/selectGraphData.ts", () => ({ selectLookupGraphData: jest.fn() }));
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppDispatch, useAppSelector }));
    jest.doMock("@/redux/planSheets/planSheetsSlice.ts", () => ({ setSymbolHide }));

    const targetData = { id: "1001", elementType: PlanElementType.COORDINATES };
    const target = {
      data: (key: string) => targetData[key as keyof typeof targetData],
    } as EdgeSingular;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const useChangeNode = (require("@/hooks/useChangeNode") as typeof import("@/hooks/useChangeNode")).useChangeNode;
    const changeNode = useChangeNode();
    changeNode(target, true);

    expect(setSymbolHide).toHaveBeenCalledWith({ id: "1002", hide: true });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(lookupSource).toHaveBeenCalledWith("coordinates", "1001");
    expect(findMarkSymbol).toHaveBeenCalledWith({ id: "1001" });
  });
});
