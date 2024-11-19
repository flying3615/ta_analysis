import { LabelPropertiesData, PanelValuesToUpdate } from "../LabelProperties";
import {
  allHave00,
  anyHasDisplayState,
  areAllPageLabels,
  cleanTextAlignment,
  createLabelPropsToBeSaved,
  getCommonPropertyValue,
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
  it("should create a new object with updated properties", () => {
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
      label: "Label1",
      textAlignment: "bottomCenter",
      displayState: "display",
      labelType: "arcRadius",
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
