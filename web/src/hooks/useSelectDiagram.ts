import { Layer } from "@/components/DefineDiagrams/MapLayers";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook";
import { userDefinedDiagramTypes } from "@/queries/diagrams";
import { clickedFeatureFilter } from "@/util/mapUtil";

export interface useSelectDiagramProps {
  transactionId: number;
  enabled: boolean;
  locked?: boolean;
}

export const useSelectDiagram = ({ enabled, locked }: useSelectDiagramProps) => {
  const { selectedFeatureIds: selectedDiagramIds } = useSelectFeatures({
    enabled,
    locked,
    layer: [Layer.SELECT_DIAGRAMS, Layer.LABELS],
    filterSelect: clickedFeatureFilter("diagramType", userDefinedDiagramTypes),
  });

  return {
    selectedDiagramIds,
  };
};
