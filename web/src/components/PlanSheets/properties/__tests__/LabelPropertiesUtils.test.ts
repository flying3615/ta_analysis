import { CartesianCoordsDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

import { LabelPropertiesData, LabelPropsToUpdate, PanelValuesToUpdate } from "../LabelProperties";
import {
  allHave00,
  anyHasDisplayState,
  areAllPageLabels,
  cleanTextAlignment,
  createLabelPropsToBeSaved,
  getCommonPropertyValue,
  getCorrectedLabelPosition,
  getTextAlignmentValues,
  someButNotAllHavePropertyValue,
} from "../LabelPropertiesUtils";

describe("getCommonPropertyValue", () => {
  it("should return the common property value when all items have the same value", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Arial" },
    ] as LabelPropertiesData[];

    const result = getCommonPropertyValue(data, "font");
    expect(result).toBe("Arial");
  });

  it("should return undefined when items have different values", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Times New Roman" },
    ] as LabelPropertiesData[];

    const result = getCommonPropertyValue(data, "font");
    expect(result).toBeUndefined();
  });

  it("should return undefined when the array is empty", () => {
    const data: LabelPropertiesData[] = [];

    const result = getCommonPropertyValue(data, "font");
    expect(result).toBeUndefined();
  });
});

describe("someButNotAllHavePropertyValue", () => {
  it("should return true when some but not all items have the specified value", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Times New Roman" },
    ] as LabelPropertiesData[];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial");
    expect(result).toBe(true);
  });

  it("should return false when all items have the specified value", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Arial" },
    ] as LabelPropertiesData[];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial");
    expect(result).toBe(false);
  });

  it("should return false when none of the items have the specified value", () => {
    const data = [
      { id: "1", label: "Label1", font: "Times New Roman" },
      { id: "2", label: "Label2", font: "Times New Roman" },
      { id: "3", label: "Label3", font: "Times New Roman" },
    ] as LabelPropertiesData[];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial");
    expect(result).toBe(false);
  });

  it("should return false when the array is empty", () => {
    const data: LabelPropertiesData[] = [];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial");
    expect(result).toBe(false);
  });

  it("should return true when some but not all items include the specified value and checkIncludes is true", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Times New Roman" },
    ] as LabelPropertiesData[];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial", true);
    expect(result).toBe(true);
  });

  it("should return false when all items include the specified value and checkIncludes is true", () => {
    const data = [
      { id: "1", label: "Label1", font: "Arial" },
      { id: "2", label: "Label2", font: "Arial" },
      { id: "3", label: "Label3", font: "Arial" },
    ] as LabelPropertiesData[];

    const result = someButNotAllHavePropertyValue(data, "font", "Arial", true);
    expect(result).toBe(false);
  });
});

describe("areAllPageLabels", () => {
  it("should return true when all items have undefined diagramId", () => {
    const data = [
      { id: "1", label: "Label1", diagramId: undefined },
      { id: "2", label: "Label2", diagramId: undefined },
    ] as LabelPropertiesData[];

    const result = areAllPageLabels(data);
    expect(result).toBe(true);
  });

  it("should return false when some items have defined diagramId", () => {
    const data = [
      { id: "1", label: "Label1", diagramId: undefined },
      { id: "2", label: "Label2", diagramId: "123" },
    ] as LabelPropertiesData[];

    const result = areAllPageLabels(data);
    expect(result).toBe(false);
  });
});

describe("allHave00", () => {
  it("should return true when all items have '00\"' in their label", () => {
    const data = [
      { id: "1", label: "25°34'00\"" },
      { id: "2", label: "198°16'00\"" },
    ] as LabelPropertiesData[];

    const result = allHave00(data);
    expect(result).toBe(true);
  });

  it("should return false when some items do not have '00\"' in their label", () => {
    const data = [
      { id: "1", label: "198°16'00\"" },
      { id: "2", label: "198°16'30\"" },
    ] as LabelPropertiesData[];

    const result = allHave00(data);
    expect(result).toBe(false);
  });
});

describe("anyHasDisplayState", () => {
  it("should return true when any item has a displayState in the provided list", () => {
    const data = [
      { id: "1", label: "Label1", displayState: "state1" },
      { id: "2", label: "Label2", displayState: "state2" },
    ] as LabelPropertiesData[];

    const result = anyHasDisplayState(data, ["state2", "state3"]);
    expect(result).toBe(true);
  });

  it("should return false when no items have a displayState in the provided list", () => {
    const data = [
      { id: "1", label: "Label1", displayState: "state1" },
      { id: "2", label: "Label2", displayState: "state2" },
    ] as LabelPropertiesData[];

    const result = anyHasDisplayState(data, ["state3", "state4"]);
    expect(result).toBe(false);
  });
});

describe("getTextAlignmentValues", () => {
  it("should return an array of text alignment values present in the items", () => {
    const data = [
      { id: "1", label: "Label1", textAlignment: "textRight" },
      { id: "2", label: "Label2", textAlignment: "textCenter" },
    ] as LabelPropertiesData[];

    const result = getTextAlignmentValues(data);
    expect(result).toEqual(["textRight", "textCenter"]);
  });

  it("should return an empty array when no text alignment values are present", () => {
    const data = [
      { id: "1", label: "Label1", textAlignment: "textLeft" },
      { id: "2", label: "Label2", textAlignment: "textLeft" },
    ] as LabelPropertiesData[];

    const result = getTextAlignmentValues(data);
    expect(result).toEqual([]);
  });
});

describe("cleanTextAlignment", () => {
  it("should remove textLeft|textCenter|textRight values from the string and trim commas", () => {
    const textAlignment1 = "bottomCenter,textCenter";
    const result1 = cleanTextAlignment(textAlignment1);
    expect(result1).toBe("bottomCenter");
    const textAlignment2 = "centerCenter,textRight";
    const result2 = cleanTextAlignment(textAlignment2);
    expect(result2).toBe("centerCenter");
  });

  it("should return an empty string when all values are removed", () => {
    const textAlignment = "textLeft,textCenter,textRight";
    const result = cleanTextAlignment(textAlignment);
    expect(result).toBe("");
  });
});

describe("createLabelPropsToBeSaved", () => {
  it("should create a new object with correct updated properties, for diagram label", () => {
    const panelValuesToUpdate: PanelValuesToUpdate = {
      labelText: "New Label",
      displayState: "hide",
      hide00: true,
      isBold: true,
      hasBorder: true,
      font: "Arial",
      fontSize: "12",
      textRotation: "45",
      justify: "textCenter",
      borderWidth: "1",
    };

    const selectedLabel = {
      id: "LAB_1",
      labelType: LabelDTOLabelTypeEnum.parcelAppellation,
      diagramId: "1",
      label: "Label1",
      textAlignment: "bottomCenter",
      displayState: "display",
      font: "Tahoma",
      fontSize: "14",
      fontStyle: "regular",
      textRotation: "0",
      borderWidth: "1",
      displayFormat: undefined,
    } as LabelPropertiesData;

    const result = createLabelPropsToBeSaved(panelValuesToUpdate, selectedLabel);
    expect(result).toEqual({
      id: 1,
      editedText: "New Label",
      displayState: "hide",
      displayFormat: "suppressSeconds",
      fontStyle: "bold",
      font: "Arial",
      fontSize: 12,
      rotationAngle: 45,
      textAlignment: "bottomCenter,textCenter",
      borderWidth: 1,
    });
  });

  it("should create a new object with correct updated properties, for page label", () => {
    const panelValuesToUpdate: PanelValuesToUpdate = {
      labelText: "New Label",
      displayState: "hide",
      hide00: true,
      isBold: true,
      hasBorder: true,
      font: "Arial",
      fontSize: "12",
      textRotation: "45",
      justify: "textCenter",
      borderWidth: "1",
    };

    const selectedLabel = {
      id: "LAB_1",
      labelType: LabelDTOLabelTypeEnum.userAnnotation,
      label: "Label1",
      textAlignment: "bottomCenter",
      displayState: "display",
      font: "Tahoma",
      fontSize: "14",
      fontStyle: "regular",
      textRotation: "0",
      borderWidth: "1",
      displayFormat: undefined,
    } as LabelPropertiesData;

    const result = createLabelPropsToBeSaved(panelValuesToUpdate, selectedLabel);
    expect(result).toEqual({
      id: 1,
      displayText: "New Label",
      displayState: "hide",
      displayFormat: "suppressSeconds",
      fontStyle: "bold",
      font: "Arial",
      fontSize: 12,
      rotationAngle: 45,
      textAlignment: "bottomCenter,textCenter",
      borderWidth: 1,
    });
  });

  it("should handle undefined properties correctly", () => {
    const panelValuesToUpdate: PanelValuesToUpdate = {};

    const selectedLabel: LabelPropertiesData = {
      id: "LAB_1",
      label: "Label1",
      fontStyle: "regular",
      textAlignment: "textLeft",
    } as LabelPropertiesData;

    const result = createLabelPropsToBeSaved(panelValuesToUpdate, selectedLabel);
    expect(result).toEqual({
      id: 1,
    });
  });
});

describe("getCorrectedLabelPosition", () => {
  let cytoCoordMapper: CytoscapeCoordinateMapper;

  const labelData = {
    id: "LAB_23",
    label: "Another\npage\n label",
    "font-family": "Roboto, sans-serif",
    "font-size": 14,
    font: "Tahoma",
    elementType: "labels",
    labelType: "userAnnotation",
    fontSize: 14,
    fontStyle: "italic",
    fontColor: "#000",
    zIndex: 200,
    textBorderOpacity: 0,
    textBorderWidth: 0,
    textBackgroundPadding: 1,
    textOutlineOpacity: 0,
    textRotation: 0,
    anchorAngle: 0,
    pointOffset: 0,
    textAlignment: "centerCenter",
    displayState: "display",
    offsetX: 0,
    offsetY: 0,
    displayText: "",
    editedText: "",
  };

  let tempLabelData: typeof labelData;

  beforeEach(() => {
    cytoCoordMapper = new CytoscapeCoordinateMapper({ clientWidth: 1640, clientHeight: 863 } as HTMLElement, diagrams);

    tempLabelData = {
      ...labelData,
      id: "temp_LAB_23",
    };

    cytoscapeUtils.getDiagramAreasLimits = jest.fn().mockReturnValue({
      diagramOuterLimitsPx: {
        x1: 34.09090909090909,
        x2: 1180.4545454545455,
        y1: 34.09090909090909,
        y2: 760.1212121212121,
      },
    });
  });

  const mockCyto = (labelPosition: CartesianCoordsDTO, attributeChanges: Partial<typeof labelData>) => {
    tempLabelData = {
      ...tempLabelData,
      ...attributeChanges,
      label: attributeChanges.displayText ?? attributeChanges.editedText ?? labelData.label,
    };
    return {
      $id(id: string) {
        if (id === "LAB_23") {
          return {
            data: jest.fn((attr?: string) => {
              if (attr) {
                return labelData[attr as keyof typeof labelData];
              }
              return labelData;
            }),
            position: jest.fn().mockReturnValue(labelPosition),
          };
        } else if (id === "temp_LAB_23") {
          return {
            data: jest.fn((attr?: string) => {
              if (attr) {
                return tempLabelData[attr as keyof typeof labelData];
              }
              return tempLabelData;
            }),
            position: jest.fn().mockReturnValue(labelPosition),
          };
        } else {
          return null;
        }
      },
      add: jest.fn(),
      remove: jest.fn(),
    } as unknown as cytoscape.Core;
  };

  it("should return undefined if the label with new edited label text and font size does not fall outside the page area", () => {
    const cyto = mockCyto({ x: 200, y: 365 }, { fontSize: 16, displayText: "Another page label" });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeUndefined();
  });

  it("should return a corrected position when the label with new attributes falls outside of page area - right bound", () => {
    const cyto = mockCyto({ x: 1157, y: 352 }, { fontSize: 16, displayText: "Another page label" });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeDefined();
    expect(result?.x).toBeCloseTo(0.3645, 3);
    expect(result?.y).toBeCloseTo(-0.1231, 3);
  });

  it("should return a corrected position when the label with new attributes falls outside of page area - left bound", () => {
    const cyto = mockCyto({ x: 50, y: 352 }, { fontSize: 16, displayText: "Another page label" });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeDefined();
    expect(result?.x).toBeCloseTo(0.0554, 3);
    expect(result?.y).toBeCloseTo(-0.1231, 3);
  });

  it("should return undefined when the label with new rotation does not fall outside page area", () => {
    const cyto = mockCyto({ x: 994, y: 60 }, { displayText: "Another page label", textRotation: 10 });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeUndefined();
  });

  it("should return corrected position when the label with new rotation falls outside page area - top bound", () => {
    const cyto = mockCyto({ x: 994, y: 60 }, { displayText: "Another page label", textRotation: 90 });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeDefined();
    expect(result?.x).toBeCloseTo(0.3415, 3);
    expect(result?.y).toBeCloseTo(-0.0507, 3);
  });

  it("should return corrected position when the label with new rotation (via properties panel) falls outside page area - bottom bound", () => {
    const cyto = mockCyto({ x: 267, y: 750 }, { displayText: "Another page label", textRotation: 90 });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "propertiesEdit",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeDefined();
    expect(result?.x).toBeCloseTo(0.0942, 3);
    expect(result?.y).toBeCloseTo(-0.2262, 3);
  });

  it("should return corrected position when the label with new rotation (via rotation slider) falls outside page area - bottom bound", () => {
    const cyto = mockCyto({ x: 267, y: 750 }, { displayText: "Another page label", textRotation: 90 });
    const result = getCorrectedLabelPosition(
      cyto,
      cytoCoordMapper,
      "LAB_23",
      "rotationSlide",
      {} as LabelPropsToUpdate,
    );
    expect(result).toBeDefined();
    expect(result?.x).toBeCloseTo(267, 3);
    expect(result?.y).toBeCloseTo(655.1154, 3);
  });
});
