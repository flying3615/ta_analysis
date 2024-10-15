import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { selectLookupGraphData } from "@/modules/plan/selectGraphData.ts";
import { setSymbolHide } from "@/redux/planSheets/planSheetsSlice.ts";

export const useChangeNode = () => {
  const dispatch = useAppDispatch();
  const lookupGraphData = useAppSelector(selectLookupGraphData);

  return (target: cytoscape.NodeSingular | cytoscape.EdgeSingular | null, hidden: boolean) => {
    const lookupElementSource = (element: NodeSingular | EdgeSingular) => {
      return lookupGraphData.lookupSource(element.data("elementType") as PlanElementType, element.data("id"));
    };

    const markSymbol = lookupGraphData.findMarkSymbol(lookupElementSource(target as NodeSingular | EdgeSingular));

    if (markSymbol) {
      const node = target?.cy().getElementById(markSymbol.id.toString());

      if (node) {
        if (hidden) {
          dispatch(setSymbolHide({ id: markSymbol.id.toString(), hide: true }));
        } else {
          dispatch(setSymbolHide({ id: markSymbol.id.toString(), hide: false }));
        }
      }
    }
  };
};
