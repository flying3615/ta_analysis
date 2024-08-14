import { Layer } from "@/components/DefineDiagrams/MapLayers";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook.ts";
import { userDefinedDiagramTypes } from "@/queries/diagrams.ts";
import { clickedFeatureFilter } from "@/util/mapUtil.ts";

export interface useSelectDiagramProps {
  transactionId: number;
  enabled: boolean;
  locked?: boolean;
}

export const useSelectDiagram = ({ enabled, locked }: useSelectDiagramProps) => {
  const { selectedFeatureIds: selectedDiagramIds } = useSelectFeatures({
    enabled,
    locked,
    layer: Layer.SELECT_DIAGRAMS,
    filterSelect: clickedFeatureFilter("diagramType", userDefinedDiagramTypes),
  });

  return {
    selectedDiagramIds,
  };
};
