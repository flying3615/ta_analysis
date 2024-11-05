import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { NodeSingular } from "cytoscape";

describe("useDeleteLabels", () => {
  test("should delete page labels", () => {
    const dispatch = jest.fn();
    const removePageLabels = jest.fn();
    const useAppDispatch = jest.fn().mockReturnValue(dispatch);
    jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppDispatch }));
    jest.doMock("@/redux/planSheets/planSheetsSlice.ts", () => ({ removePageLabels }));

    const targets = [
      {
        data: (key: string) => ({ id: "LAB_1", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
      } as NodeSingular,
      {
        data: (key: string) => ({ id: "LAB_2", labelType: LabelDTOLabelTypeEnum.userAnnotation })[key],
      } as NodeSingular,
      { data: (key: string) => ({ id: "LAB_3", labelType: LabelDTOLabelTypeEnum.obsBearing })[key] } as NodeSingular,
    ];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const useDeleteLabels = (require("@/hooks/usePageLabelEdit") as typeof import("@/hooks/usePageLabelEdit"))
      .usePageLabelEdit;
    const { deletePageLabels } = useDeleteLabels();
    deletePageLabels(targets);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(removePageLabels).toHaveBeenCalledWith({ labelIds: [1, 2] });
  });
});
