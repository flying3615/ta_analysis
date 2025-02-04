import { DiagramDTO, LabelDTO, LabelDTOLabelTypeEnum, PageDTO } from "@linz/survey-plan-generation-api-client";
import { renderHook } from "@testing-library/react";

import { INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LabelPropsToUpdate } from "@/components/PlanSheets/properties/LabelProperties";
import { planDataLabelIdToCytoscape } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { getActivePage, getPlanData, replaceDiagrams } from "@/redux/planSheets/planSheetsSlice";
import { setMockedSplitFeatures } from "@/setupTests";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";

import { useAppDispatch, useAppSelector } from "../reduxHooks";
import { useLabelsFunctions } from "../useLabelsFunctions";

jest.mock("../reduxHooks");
jest.mock("@/modules/plan/selectGraphData");
jest.mock("@/redux/planSheets/planSheetsSlice");
jest.mock("@/components/PlanSheets/properties/LabelPropertiesUtils");

describe("useLabelsFunctions", () => {
  const mockDispatch = jest.fn();
  const mockReplaceDiagrams = jest.fn((payload: DiagramDTO[]) => ({ labelType: "REPLACE_DIAGRAMS", payload }));
  jest.mocked(planDataLabelIdToCytoscape).mockImplementation((id) => `LAB_${id}`);
  const mockActiveDiagrams = [
    {
      id: 1,
      lines: [
        {
          id: 1100,
          coordRefs: [1010, 1011],
        },
      ],
      coordinates: [
        {
          id: 1010,
          position: {
            x: 15,
            y: -42,
          },
        },
        {
          id: 1011,
          position: {
            x: 25,
            y: -42,
          },
        },
      ],
    },
  ] as unknown as DiagramDTO[];
  const mockActivePage = { id: 1 } as PageDTO;

  beforeEach(() => {
    (useAppDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector === selectActiveDiagrams) return mockActiveDiagrams;
      if (selector === getActivePage) return mockActivePage;
      if (selector === getPlanData)
        return { activePage: mockActivePage, activeDiagrams: mockActiveDiagrams, surveyCentreLatitude: -45.0 };
      return undefined;
    });
    (replaceDiagrams as unknown as jest.Mock).mockImplementation(mockReplaceDiagrams);
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

  /** DATA For upDateLabels() - dispatch of Correctly Updated Diagrams **/

  const idPA = 559; // ParcelAppellation
  const idLD = 560; // Line Description
  const idLLD = 561; // Line Long Description

  const labelPropsToUpdatePA: LabelPropsToUpdate = {
    id: idPA,
    editedText: "Test\nLine2\nOther Text",
  };
  const labelPropsToUpdateLD = { ...labelPropsToUpdatePA, id: idLD };
  const labelPropsToUpdateLLD = { ...labelPropsToUpdatePA, id: idLLD };

  const selectedLabelDataPA: INodeDataProperties = {
    id: planDataLabelIdToCytoscape(idPA),
    label: "Test\nLine2 Other Text",
    diagramId: 1,
    elementType: PlanElementType.PARCEL_LABELS,
    labelType: LabelDTOLabelTypeEnum.parcelAppellation,
    fontFamily: "Roboto, sans-serif",
    fontSize: 10,
    font: "Tahoma",
  };
  const selectedLabelDataLD = {
    ...selectedLabelDataPA,
    id: planDataLabelIdToCytoscape(idLD),
    elementType: PlanElementType.LINE_LABELS,
    labelType: LabelDTOLabelTypeEnum.lineDescription,
  };
  const selectedLabelDataLLD = {
    ...selectedLabelDataPA,
    id: planDataLabelIdToCytoscape(idLLD),
    elementType: PlanElementType.LINE_LABELS,
    labelType: LabelDTOLabelTypeEnum.lineLongDescription,
  };

  const labelPA: LabelDTO = {
    id: idPA,
    labelType: LabelDTOLabelTypeEnum.parcelAppellation,
    displayText: "Test Line2 Other Text",
    font: "Arial",
    fontSize: 10,
    fontStyle: "regular",
    position: {
      x: 14.186499999999999,
      y: -52.828,
    },
    rotationAngle: 0,
    pointOffset: 0,
    anchorAngle: 0,
    textAlignment: "bottomCenter",
    displayState: "display",
    effect: "none",
    editedText: "Test\nLine2 Other Text",
  };
  const labelLD = {
    ...labelPA,
    id: idLD,
    labelType: LabelDTOLabelTypeEnum.lineDescription,
  };
  const labelLLD = {
    ...labelPA,
    id: idLLD,
    labelType: LabelDTOLabelTypeEnum.lineLongDescription,
  };

  const expectedLabelPA = {
    ...labelPA,
    ...labelPropsToUpdatePA,
  };
  const expectedLabelLD = {
    ...labelLD,
    ...labelPropsToUpdateLD,
  };
  const expectedLabelLLD = {
    ...labelLLD,
    ...labelPropsToUpdateLLD,
    editedText: "Test~rLine2~rOther Text",
  };

  const mockDiagrams = [
    {
      id: 1,
      lines: [],
      coordinates: [],
      parcelLabelGroups: [{ id: 1, labels: [labelPA] }],
      lineLabels: [labelLD, labelLLD],
    },
  ] as unknown as DiagramDTO[];

  const expectedMockDiagramsPA = [
    {
      ...mockDiagrams[0],
      parcelLabelGroups: [{ id: 1, labels: [expectedLabelPA] }],
    },
  ] as unknown as DiagramDTO[];

  const expectedMockDiagramsLD = [
    {
      ...mockDiagrams[0],
      lineLabels: [expectedLabelLD, labelLLD],
    },
  ] as unknown as DiagramDTO[];

  const expectedMockDiagramsLLD = [
    {
      ...mockDiagrams[0],
      lineLabels: [labelLD, expectedLabelLLD],
    },
  ] as unknown as DiagramDTO[];

  const labelUpdateData = [
    {
      labelPropsToUpdate: labelPropsToUpdatePA,
      selectedLabelData: selectedLabelDataPA,
      expectedDiagram: expectedMockDiagramsPA,
    },
    {
      labelPropsToUpdate: labelPropsToUpdateLD,
      selectedLabelData: selectedLabelDataLD,
      expectedDiagram: expectedMockDiagramsLD,
    },
    {
      labelPropsToUpdate: labelPropsToUpdateLLD,
      selectedLabelData: selectedLabelDataLLD,
      expectedDiagram: expectedMockDiagramsLLD,
    },
  ];

  it.each(labelUpdateData)(
    "updateLabels should call dispatch with correctly updated diagrams for $selectedLabelData.labelType",
    ({ labelPropsToUpdate, selectedLabelData, expectedDiagram }) => {
      (useAppSelector as unknown as jest.Mock).mockImplementation((selector) => {
        if (selector === selectActiveDiagrams) return mockDiagrams;
        if (selector === getActivePage) return mockActivePage;
        return undefined;
      });

      const { result } = renderHook(() => useLabelsFunctions());

      result.current.updateLabels([labelPropsToUpdate], [selectedLabelData]);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(replaceDiagrams(expectedDiagram));
    },
  );

  describe("getLabelOriginalLocation", () => {
    test("Gets the default position of the coordinate label", () => {
      const { result } = renderHook(() => useLabelsFunctions());
      const label = {
        id: "LAB_1",
        label: "Some label",
        diagramId: 1,
        elementType: PlanElementType.COORDINATE_LABELS,
        labelType: LabelDTOLabelTypeEnum.markName,
        featureId: 1010,
        featureType: "Coordinate",
      } as INodeDataProperties;

      const loc = result.current.getLabelOriginalLocation(label);
      expect(loc?.position).toEqual({ x: 15, y: -42 });
    });

    test("Gets the default position of a line label without irregularLineMidpointMode", () => {
      const { result } = renderHook(() => useLabelsFunctions());
      const label = {
        id: "LAB_=2",
        label: "Line label",
        diagramId: 1,
        elementType: PlanElementType.LINE_LABELS,
        labelType: LabelDTOLabelTypeEnum.markName,
        featureId: 1100,
        featureType: "Line",
      } as INodeDataProperties;

      const loc = result.current.getLabelOriginalLocation(label);
      expect(loc?.position).toEqual({ x: 20, y: -42 });
    });

    test("Gets the default position of a line label with irregularLineMidpointMode", () => {
      setMockedSplitFeatures({ [FEATUREFLAGS.SURVEY_PLAN_GENERATION_MIDPOINT_IRREGULAR]: "on" });

      const { result } = renderHook(() => useLabelsFunctions());
      const label = {
        id: "LAB_=2",
        label: "Line label",
        diagramId: 1,
        elementType: PlanElementType.LINE_LABELS,
        labelType: LabelDTOLabelTypeEnum.markName,
        featureId: 1100,
        featureType: "Line",
      } as INodeDataProperties;

      const loc = result.current.getLabelOriginalLocation(label);
      expect(loc?.position).toEqual({ x: 20, y: -42 });
    });
  });
});
