import { CoordinateDTO, DiagramDTO } from "@linz/survey-plan-generation-api-client";

import { mockPlanData } from "@/mocks/data/mockPlanData";
import { findLabelById, lineMidpoint, mapAllDiagramLabels, mapDiagramLabels } from "@/util/diagramUtil";

describe("diagramUtil", () => {
  test("mapDiagramLabels visits all label fields of a type", () => {
    const mappedLabelsDiagram = mapDiagramLabels(mockPlanData.diagrams[0] as DiagramDTO, "labels", (label) => {
      return { ...label, editedText: `Edited ${label.id}` };
    });

    expect(mappedLabelsDiagram.labels).toHaveLength(1);
    expect(mappedLabelsDiagram.labels[0]?.editedText).toBe("Edited 1");
  });

  test("mapAllDiagramLabels visits all label fields of any  type", () => {
    const mappedLabelsDiagram = mapAllDiagramLabels(mockPlanData.diagrams[0] as DiagramDTO, (label) => {
      return { ...label, editedText: `Edited ${label.id}` };
    });

    expect(mappedLabelsDiagram.labels).toHaveLength(1);
    expect(mappedLabelsDiagram.labels[0]?.editedText).toBe("Edited 1");
    expect(mappedLabelsDiagram.lineLabels).toHaveLength(1);
    expect(mappedLabelsDiagram.lineLabels[0]?.editedText).toBe("Edited 13");
    expect(mappedLabelsDiagram.parcelLabelGroups).toHaveLength(3);
    expect(mappedLabelsDiagram.parcelLabelGroups?.[0]?.labels[0]?.editedText).toBe("Edited 14");
    expect(mappedLabelsDiagram.parcelLabelGroups?.[1]?.labels[0]?.editedText).toBe("Edited 15");
    expect(mappedLabelsDiagram.parcelLabelGroups?.[2]?.labels[0]?.editedText).toBe("Edited 16");
    expect(mappedLabelsDiagram.coordinateLabels).toHaveLength(2);
    expect(mappedLabelsDiagram.coordinateLabels[0]?.editedText).toBe("Edited 11");
    expect(mappedLabelsDiagram.coordinateLabels[1]?.editedText).toBe("Edited 12");
    expect(mappedLabelsDiagram.childDiagrams).toHaveLength(1);
    expect(mappedLabelsDiagram.childDiagrams?.[0]?.labels[0]?.editedText).toBe("Edited 41");
    expect(mappedLabelsDiagram.childDiagrams?.[0]?.labels[1]?.editedText).toBe("Edited 42");
  });

  describe("findLabelById", () => {
    test("Can find a label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "labels", "LAB_1");
      expect(label?.id).toBe(1);
    });
    test("Can find a child diagram label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "childDiagrams", "LAB_41");
      expect(label?.id).toBe(41);
    });
    test("Can find a parcel label by cytoscape node id", () => {
      const label = findLabelById(mockPlanData.diagrams[0] as DiagramDTO, "parcelLabels", "LAB_15");
      expect(label?.id).toBe(15);
    });
  });

  describe("lineMidPoint", () => {
    test("Returns mid point of a 2 coordinate line", () => {
      expect(
        lineMidpoint(
          -45.0,
          {
            coordinates: [
              { id: 1, position: { x: 4, y: 8 } },
              { id: 2, position: { x: 10, y: 20 } },
            ] as CoordinateDTO[],
          } as DiagramDTO,
          [1, 2],
        ),
      ).toStrictEqual({ x: 7, y: 14 });
    });

    test("Returns mid point of a zero length line", () => {
      expect(
        lineMidpoint(
          -45.0,
          {
            coordinates: [
              { id: 1, position: { x: 4, y: 8 } },
              { id: 2, position: { x: 4, y: 8 } },
            ] as CoordinateDTO[],
          } as DiagramDTO,
          [1, 2],
        ),
      ).toStrictEqual({ x: 4, y: 8 });
    });

    test("Returns mid point of a 3 coordinate line with equal segment lengths", () => {
      expect(
        lineMidpoint(
          -45.0,
          {
            coordinates: [
              { id: 1, position: { x: 4, y: 8 } },
              { id: 3, position: { x: 16, y: 8 } },
              { id: 2, position: { x: 10, y: 20 } },
            ] as CoordinateDTO[],
          } as DiagramDTO,
          [1, 2, 3],
        ),
      ).toStrictEqual({ x: 10, y: 20 });
    });

    test("Returns mid point of a 3 coordinate line", () => {
      const midpoint = lineMidpoint(
        -45.0,
        {
          coordinates: [
            { id: 1, position: { x: 10, y: 10 } },
            { id: 2, position: { x: 13, y: 14 } }, // d = 5
            { id: 3, position: { x: 18, y: 26 } }, // d = 5 + 13 = 18
          ] as CoordinateDTO[],
        } as DiagramDTO,
        [1, 2, 3],
      );
      expect(midpoint.x).toBeCloseTo(14.45);
      expect(midpoint.y).toBeCloseTo(17.49);
    });
  });

  test("Returns mid point of a 7 coordinate line", () => {
    const midpoint = lineMidpoint(
      -45.0,
      {
        coordinates: [
          { id: 10005, position: { x: 26.438, y: -8.08 } },
          { id: 10006, position: { x: 34.203, y: -9.774 } },
          { id: 10007, position: { x: 39.635, y: -15.883 } },
          { id: 10008, position: { x: 47.586, y: -17.302 } },
          { id: 10009, position: { x: 51.532, y: -24.603 } },
          { id: 10001, position: { x: 52.666, y: -35.266 } },
          { id: 10002, position: { x: 19.559, y: -9.106 } },
        ] as CoordinateDTO[],
      } as DiagramDTO,
      [10002, 10005, 10006, 10007, 10008, 10009, 10001],
    );

    // Below is wrong!
    expect(midpoint.x).toBeCloseTo(39.84, 1);
    expect(midpoint.y).toBeCloseTo(-15.92, 1);
  });
});
