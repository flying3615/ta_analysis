import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks.ts";
import { DrawInteractionType, useOpenLayersDrawInteraction } from "@/hooks/useOpenLayersDrawInteraction.ts";
import { getActiveAction, setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";

export interface EnlargeDiagramProps {
  // Empty
}

const actionToTypeMap: Partial<Record<DefineDiagramsActionType, DrawInteractionType>> = {
  enlarge_diagram_rectangle: "Rectangle",
  enlarge_diagram_polygon: "Polygon",
};

export const EnlargeDiagram = (_props: EnlargeDiagramProps) => {
  const dispatch = useAppDispatch();
  const activeAction = useAppSelector(getActiveAction);

  const type = actionToTypeMap[activeAction];

  useOpenLayersDrawInteraction({
    options: { type, stopClick: true },
    drawAbort: () => {
      dispatch(setActiveAction("idle"));
    },
    drawEnd: ({ geometry }) => {
      console.log("Enlarge diagram:", geometry);

      dispatch(setActiveAction("idle"));
    },
    enabled: !!type,
  });

  return null;
};
