import { DiagramDTO, LabelDTOLabelTypeEnum, PageDTO } from "@linz/survey-plan-generation-api-client";
import { renderHook } from "@testing-library/react";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LabelPropsToUpdate } from "@/components/PlanSheets/properties/LabelProperties";
import { planDataLabelIdToCytoscape } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { getActivePage } from "@/redux/planSheets/planSheetsSlice";

import { useAppDispatch, useAppSelector } from "../reduxHooks";
import { useLabelsFunctions } from "../useLabelsFunctions";

jest.mock("../reduxHooks");
jest.mock("@/modules/plan/selectGraphData");
jest.mock("@/redux/planSheets/planSheetsSlice");
jest.mock("@/modules/plan/updatePlanData");
jest.mock("@/components/PlanSheets/properties/LabelPropertiesUtils");

describe("useLabelsFunctions", () => {
  const mockDispatch = jest.fn();
  jest.mocked(planDataLabelIdToCytoscape).mockImplementation((id) => `LAB_${id}`);
  const mockActiveDiagrams = [{ id: 1, lines: [], coordinates: [] }] as unknown as DiagramDTO[];
  const mockActivePage = { id: 1 } as PageDTO;

  beforeEach(() => {
    (useAppDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector === selectActiveDiagrams) return mockActiveDiagrams;
      if (selector === getActivePage) return mockActivePage;
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update diagram labels", () => {
    const { result } = renderHook(() => useLabelsFunctions());
    const labelsPropsToUpdate: LabelPropsToUpdate[] = [
      {
        id: 559,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
      {
        id: 560,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
    ];
    const selectedLabelsData: INodeDataProperties[] = [
      {
        id: "LAB_559",
        label: "Lot 1 DP 93547",
        diagramId: 3,
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.PARCEL_LABELS,
        labelType: LabelDTOLabelTypeEnum.parcelAppellation,
      },
      {
        id: "LAB_560",
        label: "some text",
        diagramId: 4,
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.LINE_LABELS,
        labelType: LabelDTOLabelTypeEnum.obsBearing,
      },
    ];

    result.current.updateLabels(labelsPropsToUpdate, selectedLabelsData);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should update page labels", () => {
    const { result } = renderHook(() => useLabelsFunctions());
    const labelsPropsToUpdate: LabelPropsToUpdate[] = [
      {
        id: 1061,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
      {
        id: 1062,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
    ];
    const selectedLabelsData: INodeDataProperties[] = [
      {
        id: "LAB_1061",
        label: "53.90 bal",
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.LABELS,
        labelType: "userAnnotation",
      },
      {
        id: "LAB_1062",
        label: "Some text",
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.LABELS,
        labelType: "userAnnotation",
      },
    ];

    result.current.updateLabels(labelsPropsToUpdate, selectedLabelsData);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should update page label and diagram label", () => {
    const { result } = renderHook(() => useLabelsFunctions());
    const labelsPropsToUpdate: LabelPropsToUpdate[] = [
      {
        id: 559,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
      {
        id: 1062,
        rotationAngle: 0,
        anchorAngle: 0,
        pointOffset: 0,
      },
    ];
    const selectedLabelsData: INodeDataProperties[] = [
      {
        id: "LAB_559",
        label: "Lot 1 DP 93547",
        diagramId: 3,
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.PARCEL_LABELS,
        labelType: LabelDTOLabelTypeEnum.parcelAppellation,
      },
      {
        id: "LAB_1062",
        label: "Some text",
        "font-family": "Roboto, sans-serif",
        "font-size": 10,
        font: "Tahoma",
        elementType: PlanElementType.LABELS,
        labelType: "userAnnotation",
      },
    ];

    result.current.updateLabels(labelsPropsToUpdate, selectedLabelsData);

    // it calls dispatch twice (one for diagram and one for page)
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});
