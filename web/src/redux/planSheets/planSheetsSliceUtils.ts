import {
  ConfigDataDTO,
  DiagramDTO,
  LabelDTO,
  LineDTO,
  PageDTO,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";

import { ElementToMove } from "@/components/PlanSheets/interactions/MoveElementToPageModal";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { CoordLookup } from "@/modules/plan/LookupOriginalCoord";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";

// type based on T with K keys made optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface State {
  // plan data
  configs?: ConfigDataDTO[];
  diagrams: DiagramDTO[];
  lastModifiedAt?: string;
  pages: PageDTO[];
  // auto recovery
  lastChangedAt?: string;
  // survey centre
  surveyCentreLatitude?: number;
  surveyCentreLongitude?: number;
  // UI state
  activeSheet: PlanSheetType;
  activePageNumbers: { [key in PlanSheetType]: number };
  hasChanges: boolean;
  planMode: PlanMode;
  lastUpdatedLineStyle?: string;
  lastUpdatedLabelStyle?: { font?: string; fontSize?: number };
  alignedLabelNodeId?: string;
  elementsToMove?: ElementToMove[];
  previousDiagramAttributesMap: Record<number, PreviousDiagramAttributes>;
  copiedElements?: {
    elements: LabelDTO[] | LineDTO[];
    action: "COPY" | "CUT" | "PASTE";
    type: "label" | "line";
    pageId?: number;
  };
  originalPositions?: CoordLookup;
  canViewHiddenLabels: boolean;
  navigateAfterSave?: string;
  viewableLabelTypes: string[];
  selectedElementIds?: string[];
}

/**
 * Depricated by PlanSheetsSliceV2
 * @deprecated
 */
export interface PlanSheetsStateV1 extends State {
  /**
   * @deprecated
   */
  previousHasChanges?: boolean;
  /**
   * @deprecated
   */
  previousDiagrams: DiagramDTO[] | null;
  /**
   * @deprecated
   */
  previousPages: PageDTO[] | null;
}

export type PlanSheetsStateV2 = {
  current: State;
  past: State;
  replayAction?: (state: State) => void;
};

export interface UserEdit extends PlanResponseDTO {
  lastChangedAt?: string;
}
