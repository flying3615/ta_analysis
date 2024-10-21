import cytoscape, { EdgeSingular, NodeSingular } from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { selectLookupGraphData } from "@/modules/plan/selectGraphData";
import { setSymbolHide } from "@/redux/planSheets/planSheetsSlice";

export const useChangeNode = () => {
  const dispatch = useAppDispatch();
  const lookupGraphData = useAppSelector(selectLookupGraphData);

  return (target: cytoscape.NodeSingular | cytoscape.EdgeSingular | null, hidden: boolean) => {
    const lookupElementSource = (element: NodeSingular | EdgeSingular) => {
      return lookupGraphData.lookupSource(element.data("elementType") as PlanElementType, element.data("id"));
    };

    const markSymbol = lookupGraphData.findMarkSymbol(lookupElementSource(target as NodeSingular | EdgeSingular));

    if (markSymbol) {
      dispatch(setSymbolHide({ id: markSymbol.id.toString(), hide: hidden }));
    }
  };
};
