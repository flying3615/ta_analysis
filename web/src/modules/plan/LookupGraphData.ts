import { CoordinateDTO, DiagramDTO, LabelDTO, LineDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { compact } from "lodash-es";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";

export interface LookupSourceResult {
  result: DiagramDTO | CoordinateDTO | LineDTO | LabelDTO;
  resultType: "DiagramDTO" | "CoordinateDTO" | "LineDTO" | "LabelDTO";
}

// There is one instance of this class stored in Redux that gets
// replaced (could change to updated) when the plan data changes.
// Access this through Redux selectors.
export class LookupGraphData {
  private readonly planData: PlanResponseDTO;
  private readonly diagramsById: Record<number, DiagramDTO>;
  private readonly coordinatesById: Record<number, CoordinateDTO>;
  private readonly linesById: Record<number, LineDTO>;
  private readonly labelsById: Record<number, LabelDTO>;

  private readonly diagramLabelsByFeatureAndType: Record<string, LabelDTO>;

  constructor(planData: PlanResponseDTO) {
    this.planData = planData;
    this.diagramsById = Object.fromEntries(planData.diagrams.map((diagram) => [diagram.id, diagram]));

    this.coordinatesById = {
      ...Object.fromEntries(
        this.planData.diagrams.flatMap((diagram) =>
          diagram.coordinates.map((coordinate) => [coordinate.id, coordinate]),
        ),
      ),
      ...Object.fromEntries(
        compact(
          this.planData.pages.flatMap((page) => page.coordinates?.map((coordinate) => [coordinate.id, coordinate])),
        ),
      ),
    };

    this.linesById = {
      ...Object.fromEntries(this.planData.diagrams.flatMap((diagram) => diagram.lines.map((line) => [line.id, line]))),
      ...Object.fromEntries(compact(this.planData.pages.flatMap((page) => page.lines?.map((line) => [line.id, line])))),
    };

    const allDiagramLabels = this.planData.diagrams.flatMap((diagram) => [
      ...diagram.labels,
      ...diagram.coordinateLabels,
      ...diagram.lineLabels,
      ...(diagram.parcelLabelGroups ?? []).map((group) => group.labels).flat(),
    ]);
    this.labelsById = {
      ...Object.fromEntries(allDiagramLabels.map((label) => [label.id, label])),
      ...this.planData.pages.flatMap((page) => page.labels?.map((label) => [label.id, label]) ?? []),
    };

    this.diagramLabelsByFeatureAndType = Object.fromEntries(
      allDiagramLabels
        .filter((label) => label.labelType)
        .map((label) => [`${label.featureId}-${label.labelType}`, label]),
    );
  }

  lookupSource(planElementType: PlanElementType, idString: string): LookupSourceResult | undefined {
    // This parses the first int from the string, so line segs, e.g. 1001_2, will return 1001
    const id = parseInt(idString, 10);
    if (isNaN(id)) return undefined;

    let result;
    switch (planElementType) {
      case PlanElementType.DIAGRAM:
        result = this.diagramsById[id];
        if (!result) return undefined;
        return { resultType: "DiagramDTO", result };
      case PlanElementType.COORDINATES:
        result = this.coordinatesById[id];
        if (!result) return undefined;
        return { resultType: "CoordinateDTO", result };
      case PlanElementType.LINES:
        result = this.linesById[id];
        if (!result) return undefined;
        return { resultType: "LineDTO", result };
      case PlanElementType.LABELS:
      case PlanElementType.COORDINATE_LABELS:
      case PlanElementType.LINE_LABELS:
      case PlanElementType.PARCEL_LABELS:
      case PlanElementType.CHILD_DIAGRAM_LABELS:
        result = this.labelsById[id];
        if (!result) return undefined;
        return { resultType: "LabelDTO", result };
      default:
        throw new Error(`Unknown PlanElementType: ${planElementType}`);
    }
  }

  public findMarkSymbol(fromFeature: LookupSourceResult | undefined): LabelDTO | undefined {
    if (!fromFeature || !this.planData) return undefined;

    switch (fromFeature.resultType) {
      default:
        throw new Error(`Cannot find mark symbol from a ${fromFeature.resultType}`);
      case "CoordinateDTO":
        return this.diagramLabelsByFeatureAndType[`${fromFeature.result.id}-nodeSymbol1`];
      case "LabelDTO":
        return this.diagramLabelsByFeatureAndType[`${(fromFeature.result as LabelDTO).featureId}-nodeSymbol1`];
    }
  }
}
