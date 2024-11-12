import "./DiagramList.scss";

import { DiagramDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiIcon } from "@linzjs/lui";
import { isArray, isEmpty, isNil } from "lodash-es";
import { useMemo, useState } from "react";

import { DiagramTileComponent } from "@/components/PlanSheets/DiagramTileComponent";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useAdjustLoadedPlanData } from "@/hooks/useAdjustLoadedPlanData";
import {
  getActivePageNumber,
  getActiveSheet,
  getPageRefFromPageNumber,
  setActivePageNumber,
  setDiagramPageRef,
} from "@/redux/planSheets/planSheetsSlice";

export interface DiagramListProps {
  diagrams: DiagramDTO[];
}

export interface DiagramDisplay {
  diagramId: number;
  diagramLabel: string;
  diagramChildren: DiagramDisplay[];
  level: number;
  listOrder: number;
  pageRef?: number;
}

type DiagramMap = Record<number, DiagramDTO>;
type ChildDiagramMap = Record<number, number[]>;

export const DiagramList = ({ diagrams }: DiagramListProps) => {
  const diagramHierarchy = useMemo(() => buildDiagramHierarchy(diagrams), [diagrams]);
  const [selectedDiagramId, setSelectedDiagramId] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const activePageNumber = useAppSelector(getActivePageNumber);
  const activeSheet = useAppSelector(getActiveSheet);
  const getPageRef = useAppSelector((state) => getPageRefFromPageNumber(state)(activePageNumber));

  const { adjustDiagram } = useAdjustLoadedPlanData();

  const insertDiagram = () => {
    if (getPageRef && selectedDiagramId) {
      dispatch(setDiagramPageRef({ id: selectedDiagramId, pageRef: getPageRef, adjustDiagram }));
      setSelectedDiagramId(null);
    }
  };

  const setNewActivePageNumber = (pageNumber: number | null) => {
    if (pageNumber !== null) {
      dispatch(setActivePageNumber({ pageType: activeSheet, pageNumber: pageNumber }));
    }
  };

  return (
    <>
      <div className="DiagramListWrapper">
        {diagramHierarchy.map((diagramDisplay, index) => (
          <DiagramTileComponent
            key={index}
            diagramDisplay={diagramDisplay}
            selectedDiagramId={selectedDiagramId}
            setSelectedDiagramId={setSelectedDiagramId}
            setNewActivePageNumber={setNewActivePageNumber}
          />
        ))}
      </div>
      <div className="horizontal-spacer" />
      <LuiButton level="tertiary" className="lui-full-width lui-button-icon" onClick={insertDiagram}>
        <LuiIcon size="md" name="ic_insert_into_sheet" alt="Insert diagram" />
        Insert diagram
      </LuiButton>
    </>
  );
};

const buildDiagramHierarchy = (diagrams: DiagramDTO[]): DiagramDisplay[] => {
  // a list of all the child diagramIds, these will be excluded as root diagrams
  const childDiagrams: number[] = [];
  // map of diagramId to a listOf their children diagrams
  const childDiagramMap: ChildDiagramMap = {};
  // build a map from diagramId to diagram
  const diagramMap: DiagramMap = diagrams.reduce((previousValue: DiagramMap, currentValue): DiagramMap => {
    // populate child diagram list while building the map
    const parentRef = currentValue.listParentRef;
    if (parentRef) {
      childDiagrams.push(currentValue.id);
      // build a map from diagram parents and a list of child diagramIds
      if (isArray(childDiagramMap[parentRef])) {
        childDiagramMap[parentRef]?.push(currentValue.id);
      } else {
        childDiagramMap[parentRef] = [currentValue.id];
      }
    }
    previousValue[currentValue.id] = currentValue;
    return previousValue;
  }, {});
  const rootDiagrams: DiagramDisplay[] = [];
  const level = 0;
  for (const diagram of diagrams) {
    if (!childDiagrams.includes(diagram.id)) {
      const rootDiagram: DiagramDisplay = diagramToDiagramDisplay(diagram, level, diagramMap, childDiagramMap);
      rootDiagrams.push(rootDiagram);
    }
  }

  return rootDiagrams.sort(diagramDisplaySortFn);
};

const diagramToDiagramDisplay = (
  diagram: DiagramDTO,
  level: number,
  diagramMap: DiagramMap,
  childDiagramMap: ChildDiagramMap,
): DiagramDisplay => ({
  diagramId: diagram.id,
  diagramLabel: getDiagramName(diagram.labels, diagram.id),
  level: level,
  // Recursively create more child diagrams
  diagramChildren: createChildDiagrams(diagramMap, childDiagramMap, level, childDiagramMap[diagram.id]),
  listOrder: diagram.listOrder,
  pageRef: diagram.pageRef,
});
/**
 * Recursive function for building the diagram hierarchy
 * @param diagramMap a map from diagramId to diagram
 * @param childDiagramMap a map from a diagram map to a list of the diagram ids of its direct children
 * @param level the level in the tree
 * @param diagramIds the ids of all diagrams to create
 */
const createChildDiagrams = (
  diagramMap: DiagramMap,
  childDiagramMap: ChildDiagramMap,
  level: number,
  diagramIds?: number[],
): DiagramDisplay[] => {
  if (isNil(diagramIds) || isEmpty(diagramIds)) {
    return [];
  }
  const diagramDisplayItems: DiagramDisplay[] = [];
  for (const diagramId of diagramIds) {
    const diagram = diagramMap[diagramId];
    if (diagram) {
      diagramDisplayItems.push(diagramToDiagramDisplay(diagram, level + 1, diagramMap, childDiagramMap));
    }
  }
  return diagramDisplayItems.sort(diagramDisplaySortFn);
};

const getDiagramName = (labels: LabelDTO[], diagramNumber: number): string => {
  const diagramLabel = labels.find((l) => "diagram" === l.labelType);
  if (diagramLabel) {
    return diagramLabel.displayText;
  } else {
    return `Diagram ${diagramNumber}`;
  }
};

const diagramDisplaySortFn = (a: DiagramDisplay, b: DiagramDisplay) => {
  return a.listOrder - b.listOrder;
};
