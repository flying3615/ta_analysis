import "./DiagramList.scss";

import { IDiagram, ILabel } from "@linz/survey-plan-generation-api-client";
import { LuiIcon, LuiTooltip } from "@linzjs/lui";
import { right } from "@popperjs/core";
import { isArray, isEmpty, isNil } from "lodash-es";
import { useMemo } from "react";

export interface DiagramListProps {
  diagrams: IDiagram[];
}

export interface DiagramDisplay {
  diagramId: number;
  diagramLabel: string;
  diagramChildren: DiagramDisplay[];
  level: number;
  listOrder: number;
}

type DiagramMap = Record<number, IDiagram>;
type ChildDiagramMap = Record<number, number[]>;

export const DiagramList = ({ diagrams }: DiagramListProps) => {
  const diagramHierarchy = useMemo(() => buildDiagramHierarchy(diagrams), [diagrams]);
  return (
    <div className="DiagramListWrapper">
      {diagramHierarchy.map((d, index) => (
        <DiagramTileComponent key={index} diagramDisplay={d} />
      ))}
    </div>
  );
};

const DiagramTileComponent = ({ diagramDisplay }: { diagramDisplay: DiagramDisplay }) => {
  const paddingMultiple = diagramDisplay.level <= 1 ? 0 : diagramDisplay.level - 1;
  return (
    <div>
      <div
        style={{
          paddingLeft: 12 * paddingMultiple + 8,
        }}
        className="DiagramListLabel"
      >
        <LuiTooltip mode="default-withDelay" message={diagramDisplay.diagramLabel} placement={right}>
          <span>
            {diagramDisplay.level != 0 && (
              <LuiIcon size="sm" name="ic_subdirectory_arrow_right" alt="subdirectory" className="DiagramListIcon" />
            )}
            {diagramDisplay.diagramLabel}
          </span>
        </LuiTooltip>
      </div>
      {diagramDisplay.diagramChildren.map((d, index) => (
        <DiagramTileComponent key={index} diagramDisplay={d} />
      ))}
    </div>
  );
};

const buildDiagramHierarchy = (diagrams: IDiagram[]): DiagramDisplay[] => {
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
  diagram: IDiagram,
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

const getDiagramName = (labels: ILabel[], diagramNumber: number): string => {
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
