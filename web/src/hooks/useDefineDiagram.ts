import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";
import { useCheckDiagramsQuery } from "@/queries/diagrams";

export interface useDefineDiagramProps {
  transactionId: number;
}

export const useDefineDiagram = ({ transactionId }: useDefineDiagramProps) => {
  const { data } = useCheckDiagramsQuery({
    transactionId,
  });
  const disabledDiagramIds: DefineDiagramsActionType[] = [];
  if (!transactionId) {
    return { disabledDiagramIds };
  }

  if (data !== undefined) {
    if (!data?.isPrimaryParcelsExists) {
      disabledDiagramIds.push("define_primary_diagram_rectangle", "define_primary_diagram_polygon");
    }

    if (!data?.isTraverseExists) {
      disabledDiagramIds.push("define_survey_diagram_rectangle", "define_survey_diagram_polygon");
    }

    if (!data?.isNonPrimaryParcelsExists) {
      disabledDiagramIds.push("define_nonprimary_diagram_rectangle", "define_nonprimary_diagram_polygon");
    }
  }

  return {
    disabledDiagramIds,
  };
};
