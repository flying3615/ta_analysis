import cytoscape, { NodeSingular } from "cytoscape";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { IGraphDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { LabelTextInput } from "@/components/LabelTextInput/LabelTextInput";
import { addSelectedElemtId } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { isEditableLabelTextType } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";

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
  // Track labels already clicked once
  const [clickedLabelIds, setClickedLabelIds] = useState<string[]>([]);
  const { result: isMouseDownDragElementsEnabled } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_MOUSE_DOWN_DRAG_ELEMENTS,
  );

  useEscapeKey({
    callback: () => {
      setInputPosition(undefined);
    },
  });

  const onClick = useCallback(
    (event: cytoscape.EventObjectCore | cytoscape.EventObjectNode) => {
      if (!cyto || !cytoCoordMapper) return;

      const selectedIds = cyto.$(":selected").map((element) => element.id());
      const target = event.target as NodeSingular;
      const { id, label, labelType, elementType, diagramId } = target.data() as IGraphDataProperties;

      if (event.originalEvent.ctrlKey) {
        isMouseDownDragElementsEnabled && setClickedLabelIds(id ? addSelectedElemtId(id, selectedIds) : selectedIds);
        // prevent from showing input when ctrl is pressed
        return;
      }
      if (id && label && labelType && isEditableLabelTextType(labelType)) {
        const isDoubleClicked = isMouseDownDragElementsEnabled ? clickedLabelIds.includes(id) : target.selected();
        isDoubleClicked && setLabelData({ id, label, labelType, elementType, diagramId });
        isDoubleClicked && setInputPosition({ x: event.originalEvent.clientX, y: event.originalEvent.clientY });
        isMouseDownDragElementsEnabled &&
          setClickedLabelIds(event.originalEvent.shiftKey ? addSelectedElemtId(id, selectedIds) : [id]);
      } else {
        setInputPosition(undefined);
        isMouseDownDragElementsEnabled &&
          setClickedLabelIds(!id ? [] : event.originalEvent.shiftKey ? addSelectedElemtId(id, selectedIds) : [id]);
      }
    },
    [clickedLabelIds, cyto, cytoCoordMapper, isMouseDownDragElementsEnabled],
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
