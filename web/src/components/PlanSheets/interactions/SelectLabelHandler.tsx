import cytoscape, { NodeSingular } from "cytoscape";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { IGraphDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { LabelTextInput } from "@/components/LabelTextInput/LabelTextInput";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { isEditableLabelTextType } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";

export const SelectLabelHandler = () => {
  const { cyto } = useCytoscapeContext();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(() => (container ? new CytoscapeCoordinateMapper(container, []) : null), [container]);

  const [inputPosition, setInputPosition] = useState<cytoscape.Position>();
  const [labelData, setLabelData] = useState<{
    id: string;
    label: string;
    labelType: string;
    elementType?: PlanElementType;
    diagramId?: number;
  }>();

  useEscapeKey({
    callback: () => {
      setInputPosition(undefined);
    },
  });

  const onClick = useCallback(
    (event: cytoscape.EventObjectCore | cytoscape.EventObjectNode) => {
      if (!cyto || !cytoCoordMapper) return;

      if (event.originalEvent.ctrlKey) return; // prevent from showing input when ctrl is pressed

      const target = event.target as NodeSingular;
      const { id, label, labelType, elementType, diagramId } = target.data() as IGraphDataProperties;
      if (id && label && labelType && isEditableLabelTextType(labelType) && target.selected()) {
        setLabelData({ id, label, labelType, elementType, diagramId });
        setInputPosition({ x: event.originalEvent.clientX, y: event.originalEvent.clientY });
      } else {
        setInputPosition(undefined);
      }
    },
    [cyto, cytoCoordMapper],
  );

  useEffect(() => {
    cyto?.on("click", onClick);
    return () => {
      cyto?.off("click", onClick);
    };
  }, [cyto, onClick]);

  return (
    inputPosition &&
    labelData && (
      <LabelTextInput inputPosition={inputPosition} setInputPosition={setInputPosition} labelData={labelData} />
    )
  );
};
